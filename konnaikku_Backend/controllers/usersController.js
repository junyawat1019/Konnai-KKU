const pool = require("../config/db")

/* ===============================
   GET USER PROFILE
================================ */

exports.getUser = async (req,res)=>{

  try{

    const [rows] = await pool.query(
      `SELECT
        id,
        display_name,
        email,
        gender,
        birthday,
        about_me,
        phone_number,
        photo_url,
        created_at
       FROM users
       WHERE id=?`,
      [req.params.id]
    )

    if(!rows.length){
      return res.status(404).json({message:"user not found"})
    }

    res.json(rows[0])

  }catch(err){

    console.error(err)
    res.status(500).json({message:"load user failed"})

  }

}

/* ===============================
   CURRENT USER
================================ */

exports.getMe = async (req,res)=>{

  try{

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE id=?",
      [req.user.id]
    )

    res.json(rows[0])

  }catch(err){

    console.error(err)
    res.status(500).json({message:"load me failed"})

  }

}

/* ===============================
   UPDATE PROFILE
================================ */

exports.updateProfile = async (req,res)=>{

  try{

    const {
      display_name,
      gender,
      birthday,
      about_me,
      phone_number,
      photo_url
    } = req.body

    await pool.query(
      `UPDATE users
       SET
        display_name=?,
        gender=?,
        birthday=?,
        about_me=?,
        phone_number=?,
        photo_url=?
       WHERE id=?`,
      [
        display_name,
        gender,
        birthday,
        about_me,
        phone_number,
        photo_url,
        req.user.id
      ]
    )

    res.json({message:"Profile updated"})

  }catch(err){

    console.error(err)
    res.status(500).json({message:"update profile failed"})

  }

}

/* ===============================
   USER REVIEWS
================================ */

exports.getUserReviews = async (req,res)=>{

  try{

    const [rows] = await pool.query(
      `SELECT
        r.*,
        p.name AS place_name
       FROM reviews r
       JOIN places p
         ON r.place_id = p.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    )

    res.json(rows)

  }catch(err){

    console.error(err)
    res.status(500).json({message:"load reviews failed"})

  }

}

/* ===============================
   USER PLACES
================================ */

exports.getUserPlaces = async (req,res)=>{

  try{

    const [rows] = await pool.query(
      `SELECT
        p.id,
        p.name,
        p.price_level,
        p.created_at,
        c.name AS category_name
       FROM places p
       LEFT JOIN categories c
         ON p.category_id = c.id
       WHERE p.created_by = ?
       ORDER BY p.created_at DESC`,
      [req.params.id]
    )

    res.json(rows)

  }catch(err){

    console.error(err)
    res.status(500).json({message:"load places failed"})

  }

}

/* ===============================
   USER FAVORITES
================================ */

exports.getUserFavorites = async (req,res)=>{

  try{

    const [rows] = await pool.query(
      `SELECT
        p.id AS placeId,
        p.name,
        (
          SELECT image_url
          FROM place_images
          WHERE place_id = p.id
          LIMIT 1
        ) AS imageUrl
      FROM favorites f
      JOIN places p
        ON f.place_id = p.id
      WHERE f.user_id = ?`,
      [req.params.id]
    )

    res.json(rows)

  }catch(err){

    console.error("favorites error:",err)

    res.status(500).json({
      message:"load favorites failed"
    })

  }

}

/* ===============================
   FOLLOWERS / FOLLOWING
================================ */

exports.getFollowers = async (req,res)=>{

  try{

    const userId = req.params.id

    const [followers] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM follows
       WHERE following_id=?`,
      [userId]
    )

    const [following] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM follows
       WHERE follower_id=?`,
      [userId]
    )

    res.json({
      followersCount: followers[0].count,
      followingCount: following[0].count
    })

  }catch(err){

    console.error(err)
    res.status(500).json({message:"followers error"})

  }

}

/* ===============================
   USER PHOTOS (from reviews)
================================ */

exports.getUserPhotos = async (req,res)=>{

  try{

    const userId = req.params.id

    const [rows] = await pool.query(
      `SELECT
        ri.id,
        ri.image_url AS url,
        r.place_id,
        r.created_at
       FROM review_images ri
       JOIN reviews r
         ON ri.review_id = r.id
       WHERE r.user_id = ?

       UNION ALL

       SELECT
        pi.id,
        pi.image_url AS url,
        p.id AS place_id,
        p.created_at
       FROM place_images pi
       JOIN places p
         ON pi.place_id = p.id
       WHERE p.created_by = ?

       ORDER BY created_at DESC`,
      [userId,userId]
    )

    res.json(rows)

  }catch(err){

    console.error("photos error:",err)
    res.status(500).json({message:"load photos failed"})

  }

}

/* ===============================
   ACTIVITY FEED
================================ */

exports.getUserActivity = async (req,res)=>{

  try{

    const userId = req.params.id

    const [places] = await pool.query(
      `SELECT
        'add_place' AS type,
        p.name AS placeName,
        p.created_at AS createdAt
       FROM places p
       WHERE p.created_by = ?`,
      [userId]
    )

    const [reviews] = await pool.query(
      `SELECT
        'review' AS type,
        p.name AS placeName,
        r.created_at AS createdAt
       FROM reviews r
       JOIN places p
         ON r.place_id = p.id
       WHERE r.user_id = ?`,
      [userId]
    )

    const activity = [...places,...reviews]

    activity.sort(
      (a,b)=>new Date(b.createdAt)-new Date(a.createdAt)
    )

    res.json(activity)

  }catch(err){

    console.error(err)
    res.status(500).json({message:"load activity failed"})

  }

}