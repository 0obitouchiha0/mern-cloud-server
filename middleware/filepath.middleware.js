function filepathMiddleware(path) {
    return function corsMiddleware(req, res, next) {
        req.filePath = path
        next()
    }
}




module.exports = filepathMiddleware