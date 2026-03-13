const pool = require("../config/db")
const s3 = require("../config/space")
const { v4: uuidv4 } = require("uuid")

/* =========================
   GET ALL PLACES
========================= */

exports.getPlaces = async (req,res)=>{

  try{

    const [rows] = await pool.query(`
      SELECT
        p.*,
        c.name AS category_name
      FROM places p
      LEFT JOIN categories c
      ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `)

    res.json(rows)

  }catch(err){

    console.error(err)

    res.status(500).json({
      message:"get places error"
    })

  }

}


/* =========================
   GET SINGLE PLACE
========================= */

exports.getPlace = async (req,res)=>{

  try{

    const placeId = req.params.id

    const [rows] = await pool.query(`
      SELECT
        p.*,
        c.name AS category_name
      FROM places p
      LEFT JOIN categories c
      ON p.category_id = c.id
      WHERE p.id = ?
    `,[placeId])

    if(!rows.length){

      return res.status(404).json({
        message:"place not found"
      })

    }

    res.json(rows[0])

  }catch(err){

    console.error(err)

    res.status(500).json({
      message:"get place error"
    })

  }

}


/* =========================
   GET PLACE IMAGES
========================= */

exports.getPlaceImages = async (req,res)=>{

  try{

    const placeId = req.params.id

    const [rows] = await pool.query(`
      SELECT image_url
      FROM place_images
      WHERE place_id = ?
    `,[placeId])

    res.json(rows)

  }catch(err){

    console.error(err)

    res.status(500).json({
      message:"get images error"
    })

  }

}


/* =========================
   CREATE PLACE
========================= */

exports.createPlace = async (req,res)=>{

  const {
    name,
    description,
    category_id,
    price_level,
    address,
    district,
    province,
    lat,
    lng,
    phone_number,
    website_url,
    location_tag
  } = req.body

  const userId = req.user.id

  const conn = await pool.getConnection()

  try{

    await conn.beginTransaction()

    const [result] = await conn.query(`
      INSERT INTO places
      (
        name,
        description,
        category_id,
        price_level,
        address,
        district,
        province,
        lat,
        lng,
        phone_number,
        website_url,
        location_tag,
        created_by
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
    `,[
      name,
      description,
      category_id,
      price_level,
      address,
      district,
      province,
      lat,
      lng,
      phone_number,
      website_url,
      location_tag,
      userId
    ])

    const placeId = result.insertId


    /* =========
       UPLOAD IMAGES
    ========= */

    if(req.files && req.files.length){

      for(const file of req.files){

        const ext = file.originalname.split(".").pop()

        const key =
          `places/${placeId}/${uuidv4()}.${ext}`

        const params = {

          Bucket:process.env.DO_SPACES_BUCKET,
          Key:key,
          Body:file.buffer,
          ACL:"public-read",
          ContentType:file.mimetype

        }

        await s3.upload(params).promise()

        const url =
          `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${key}`

        await conn.query(`
          INSERT INTO place_images
          (place_id,image_url)
          VALUES (?,?)
        `,[placeId,url])

      }

    }

    await conn.commit()

    res.json({
      id:placeId
    })

  }catch(err){

    await conn.rollback()

    console.error(err)

    res.status(500).json({
      message:"create place error"
    })

  }finally{

    conn.release()

  }

}


/* =========================
   UPDATE PLACE
========================= */

exports.updatePlace = async (req,res)=>{

  const placeId = req.params.id

  const {
    name,
    description,
    category_id,
    price_level,
    address,
    district,
    province,
    lat,
    lng,
    phone_number,
    website_url,
    location_tag,
    removedImages
  } = req.body

  let removed = []

  if(removedImages){

    try{
      removed = JSON.parse(removedImages)
    }catch{
      removed = []
    }

  }

  const conn = await pool.getConnection()

  try{

    await conn.beginTransaction()


    /* =========
       CHECK OWNER
    ========= */

    const [owner] = await conn.query(`
      SELECT created_by
      FROM places
      WHERE id = ?
    `,[placeId])

    if(!owner.length){

      return res.status(404).json({
        message:"place not found"
      })

    }

    if(owner[0].created_by !== req.user.id){

      return res.status(403).json({
        message:"forbidden"
      })

    }


    /* =========
       UPDATE PLACE
    ========= */

    await conn.query(`
      UPDATE places SET
        name=?,
        description=?,
        category_id=?,
        price_level=?,
        address=?,
        district=?,
        province=?,
        lat=?,
        lng=?,
        phone_number=?,
        website_url=?,
        location_tag=?
      WHERE id=?
    `,[
      name,
      description,
      category_id,
      price_level,
      address,
      district,
      province,
      lat,
      lng,
      phone_number,
      website_url,
      location_tag,
      placeId
    ])


    /* =========
       DELETE IMAGES
    ========= */

    if(removed.length){

      await conn.query(`
        DELETE FROM place_images
        WHERE place_id = ?
        AND image_url IN (?)
      `,[placeId,removed])

    }


    /* =========
       UPLOAD NEW IMAGES
    ========= */

    if(req.files && req.files.length){

      for(const file of req.files){

        const ext = file.originalname.split(".").pop()

        const key =
          `places/${placeId}/${uuidv4()}.${ext}`

        const params = {

          Bucket:process.env.DO_SPACES_BUCKET,
          Key:key,
          Body:file.buffer,
          ACL:"public-read",
          ContentType:file.mimetype

        }

        await s3.upload(params).promise()

        const url =
          `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${key}`

        await conn.query(`
          INSERT INTO place_images
          (place_id,image_url)
          VALUES (?,?)
        `,[placeId,url])

      }

    }

    await conn.commit()

    res.json({
      message:"update place success"
    })

  }catch(err){

    await conn.rollback()

    console.error(err)

    res.status(500).json({
      message:"update place error"
    })

  }finally{

    conn.release()

  }

}


/* =========================
   DELETE PLACE
========================= */

exports.deletePlace = async (req,res)=>{

  const placeId = req.params.id

  const conn = await pool.getConnection()

  try{

    await conn.beginTransaction()

    const [owner] = await conn.query(`
      SELECT created_by
      FROM places
      WHERE id=?
    `,[placeId])

    if(!owner.length){

      return res.status(404).json({
        message:"place not found"
      })

    }

    if(owner[0].created_by !== req.user.id){

      return res.status(403).json({
        message:"forbidden"
      })

    }

    await conn.query(`
      DELETE FROM place_images
      WHERE place_id=?
    `,[placeId])

    await conn.query(`
      DELETE FROM places
      WHERE id=?
    `,[placeId])

    await conn.commit()

    res.json({
      message:"place deleted"
    })

  }catch(err){

    await conn.rollback()

    console.error(err)

    res.status(500).json({
      message:"delete place error"
    })

  }finally{

    conn.release()

  }

}