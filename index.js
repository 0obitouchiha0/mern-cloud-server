const express = require('express')
const mongoose = require('mongoose')
const config = require('config')
const fileUpload = require('express-fileupload')
const corsMiddleware = require('./middleware/cors.middleware')
const filepathMiddleware = require('./middleware/filepath.middleware')
const authRouter = require('./routes/auth.routes')
const fileRouter = require('./routes/file.routes')
const path = require('path')

const app = express()

const PORT = process.env.PORT || config.get('serverPort')

app.use(fileUpload({}))
app.use(corsMiddleware)
app.use(filepathMiddleware(path.resolve(__dirname, 'files')))
app.use(express.json())
app.use(express.static('static'))
app.use('/api/auth', authRouter)
app.use('/api/files', fileRouter)

const start = async () => {
    try {

        mongoose.connect(config.get('dbUrl'))

        app.listen(PORT, () => console.log('server started on port ' + PORT))
    }
    catch(e) {

    }
}

start()