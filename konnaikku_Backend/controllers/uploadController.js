const s3 = require("../config/space")
const { v4: uuidv4 } = require("uuid")

exports.uploadProfilePhoto = async (req,res)=>{

  try{

    if(!req.file){
      return res.status(400).json({message:"No file"})
    }

    const file = req.file

    const key = `profile/${uuidv4()}-${file.originalname}`

    const params = {
      Bucket: process.env.DO_SPACES_BUCKET,
      Key: key,
      Body: file.buffer,
      ACL: "public-read",
      ContentType: file.mimetype
    }

    await s3.upload(params).promise()

    const url = `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${key}`

    res.json({url})

  }catch(err){

    console.error(err)
    res.status(500).json({message:"upload error"})

  }

}