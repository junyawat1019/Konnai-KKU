const express = require("express")
const router = express.Router()

const upload = require("../middlewares/upload")
const auth = require("../middlewares/auth")
const uploadController = require("../controllers/uploadController")

router.post(
  "/profile-photo",
  auth,
  upload.single("image"),
  uploadController.uploadProfilePhoto
)

module.exports = router