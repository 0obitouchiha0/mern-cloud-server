const Router = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const config = require('config')
const {check, validationResult} = require('express-validator')
const User = require('../models/user')
const router = new Router()
const authMiddleware = require('../middleware/auth.middleware')
const fileService = require('../services/fileService')
const File = require('../models/file')

router.post('/registration',
    [
        check('email', 'Incorrect email').isEmail(),
        check('password', 'Password must be longer than 3 and shorter than 12').isLength({min: 3, max: 12})
    ],
    async (req,  res) => {
    try {

        const errors = validationResult(req)
        if(!errors.isEmpty()) {
            return res.status(400).json({message: 'Incorrect request', errors})
        }

        const {email, password} = req.body
        const candidate = await User.findOne({email})
        console.log(candidate)

        if(candidate) {
            return res.status(400).json({message: 'user already exists'})
        }

        const hashPassword = await bcrypt.hash(password, 8)

        const user = new User({email, password: hashPassword})
        await user.save()
        await fileService.createDir(req, new File({user: user.id, name: ''}))
        return res.json({message: 'user was created'})
    }
    catch (e) {
        console.log(e)
        res.send({message: 'server error'})
    }
})

router.post('/login', async (req,  res) => {
        try {

            const {email, password} = req.body
            const user = await User.findOne({email})

            if(!user) {
                return res.status(400).json({message: 'user doesnt exists'})
            }

            const isPassValid = bcrypt.compare(password, user.password)

            if(!isPassValid) {
                return res.status(400).json({message: 'invalid password'})
            }
            console.log(user.id)
            const token = jwt.sign({id: user.id}, config.get('secretKey'), {expiresIn: '1h'})

            return res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    discSpace: user.discSpace,
                    usedSpace: user.usedSpace,
                    avatar: user.avatar
                }
            })
        }
        catch (e) {
            console.log(e)
            res.send({message: 'server error'})
        }
})

router.get('/auth', authMiddleware, async (req,  res) => {
    try {
        console.log('router ', req.user.id)
        const user = await User.findOne({id: req.user.id})
        if(!user) return res.ststus(400).json({message: 'token error'})
        return res.json({
            token: req.token,
            user: {
                id: user.id,
                email: user.email,
                discSpace: user.discSpace,
                usedSpace: user.usedSpace,
                avatar: user.avatar
            }
        })
    }
    catch (e) {
        console.log(e)
        res.send({message: 'server error'})
    }
})


module.exports = router