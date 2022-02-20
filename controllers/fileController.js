const fileService = require('../services/fileService')
const File = require('../models/file')
const User = require('../models/user')
const config = require('config')
const fs = require('fs')
const Uuid = require('uuid')

class FileController {
    async createDir(req, res) {
        try {
            const {name, type, parent} = req.body
            console.log('parent ', parent)
            const file = new File({name, type, parent, user: req.user.id})
            const parentFile = parent ? await File.findOne({_id: parent}) : false
            if(!parentFile) {
                file.path = name
                await fileService.createDir(req, file)
            }
            else {
                file.path = `${parentFile.path}\\${file.name}`
                await fileService.createDir(req, file)
                parentFile.children.push(file.id)
                await parentFile.save()
            }
            console.log(file)
            await file.save()
            return res.json(file)
        }
        catch (e) {
            console.log(e)
            return res.status(400).json(e)
        }
    }

    async getFiles(req, res) {
        try {
            const {sort} = req.query
            let files


            switch (sort) {
                case 'name':
                    console.log(sort)
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({name: 1})
                    break
                case 'type':
                    console.log(sort)
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({type: 1})
                    break
                case 'date':
                    console.log(sort)
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({date: 1})
                    break
                case 'size':
                    console.log(sort)
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({size: 1})
                    break
                default:
                    files = await File.find({user: req.user.id, parent: req.query.parent})
            }

            return res.json({files})
        }
        catch (e) {
            console.log(e)
            return res.status(400).json(e)
        }
    }

    async uploadFile(req, res) {
        try {
            const file = req.files.file
            console.log(file)

            const parent = await File.findOne({user: req.user.id, _id: req.body.parent})
            const user = await User.findOne({_id: req.user.id})

            console.log(user.usedSpace + file.size, user.diskSpace)

            if(user.usedSpace + file.size > user.diskSpace) {
                return res.status(400).json({message: 'there isn`t enough space'})
            }

            user.usedSpace = user.usedSpace + file.size

            let path
            if(parent) {
                path = `${req.filePath}\\${user._id}\\${parent.path}\\${file.name}`
            } else {
                path = `${req.filePath}\\${user._id}\\${file.name}`
            }

            if(fs.existsSync(path)) {
                return res.status(400).json({message: 'file already exists'})
            }

            file.mv(path)

            const type = file.name.split('.').pop()
            let filePath = file.name
            if(parent) {
                filePath = parent.path + '\\' + file.name
            }
            const dbFile = new File({
                name: file.name,
                type,
                size: file.size,
                path: filePath,
                parent: parent?._id,
                user: user._id
            })

            await dbFile.save()
            await user.save()

            res.json(dbFile)
        }
        catch (e) {
            console.log(e)
            return res.status(400).json({message: 'upload error'})
        }
    }

    async downloadFile(req, res) {
        try {
            const file = await File.findOne({_id: req.query.id, user: req.user.id})
            const path =  fileService.getPath(file)
            console.log(path)
            if(fs.existsSync(path)) {
                return res.download(path, file.name)
            }
            return res.status(500).json({message: 'download error'})
        }
        catch (e) {
            console.log(e)
            return res.status(400).json(e)
        }
    }

    async deleteFile(req, res) {
        try {
            const file = await File.findOne({_id: req.query.id, user: req.user.id})
            if(!file) {
                return res.status(401).json({message: 'file not found'})
            }
            fileService.deleteFile(req, file)
            await file.remove()
            return res.json({message: 'file was deleted'})
        }
        catch (e) {
            console.log(e)
            return res.status(403).json({message: 'dir is not empty'})
        }
    }

    async searchFile(req, res) {
        try {
            const searchName = req.query.search
            let files = await File.find({user: req.user.id})
            files = files.filter(file => file.name.includes(searchName))
            return res.json({files})

        }
        catch (e) {
            console.log(e)
            return res.status(403).json({message: 'search error'})
        }
    }

    async uploadAvatar(req, res) {
        try {
            const file = req.files.file

            const user = await User.findOne({_id: req.user.id})

            const avatarName = Uuid.v4() + '.jpg'
            file.mv(config.get('staticPath') + '\\' + avatarName)

            user.avatar = avatarName
            await user.save()

            res.status(200).json(user)
        }
        catch (e) {
            console.log(e)
            return res.status(400).json({message: 'upload avatar error'})
        }
    }

    async deleteAvatar(req, res) {
        try {
            const user = await User.findOne({_id: req.user.id})
            const path = config.get('staticPath') + '\\' + user.avatar

            if(fs.existsSync(path)) {
                fs.unlinkSync(path)
            }
            user.avatar = null

            await user.save()

            res.status(200).json(user)
        }
        catch (e) {
            console.log(e)
            return res.status(400).json(user)
        }
    }
}



module.exports = new FileController()