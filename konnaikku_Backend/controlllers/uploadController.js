exports.uploadImage = async (req, res) => {
  try {

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded"
      })
    }

    res.json({
      message: "Upload successful",
      imageUrl: req.file.location
    })

  } catch (error) {
    res.status(500).json({
      message: "Upload failed",
      error: error.message
    })
  }
}