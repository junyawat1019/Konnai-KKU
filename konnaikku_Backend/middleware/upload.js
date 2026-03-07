const multer = require('multer')
const multerS3 = require('multer-s3')
const s3 = require('../config/spaces')

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.DO_SPACES_BUCKET,
    acl: 'public-read',
    key: function (req, file, cb) {
      const fileName = Date.now().toString() + '-' + file.originalname
      cb(null, 'places/' + fileName)
    }
  })
})

module.exports = upload