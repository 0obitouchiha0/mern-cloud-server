const fs = require('fs')
const config = require('config')

class FileService {

    createDir(req, file) {

        const filePath = `${req.filePath}\\${file.user}\\${file.path}`

        return new Promise((resolve, reject) => {
            try {
                if(!fs.existsSync(filePath)) {
                    fs.mkdirSync(filePath)
                    return resolve({message: 'created file'})
                }
                else {
                    return reject({message: 'file already exists'})
                }
            }
            catch(e) {
                return reject({message: 'create file error'})
            }
        })
    }


    deleteFile(req, file) {

        const path = this.getPath(req, file)
        console.log(file.path)

        console.log(file)

        if(file.type === 'dir') {
            fs.rmdirSync(path)
        }
        else {
            fs.unlinkSync(path)
        }
    }

    getPath(req, file) {
        return `${req.filePath}\\${file.user}\\${file.path}`
    }
}

module.exports = new FileService()