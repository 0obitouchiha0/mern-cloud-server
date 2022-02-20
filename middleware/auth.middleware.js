const jwt = require('jsonwebtoken')
const config = require('config')


module.exports = (req, res, next) => {
    if(req.method === 'OPTIONS') {
        return next()
    }

    try {
        const token = req.headers.authorization.split(' ')[1]
        if(!token) {
            return res.status(401).json({message: 'auth error'})
        }
        console.log(token)
        user = jwt.verify(token, config.get('secretKey'))
        req.user = user
        req.token = token
        console.log('middleware ', user.id)
        next()
    }
    catch(e) {
        return res.status(401).json({message: 'auth error'})
    }
}