const pool = require("../config/db")
const s3 = require("../config/space")
const { v4: uuidv4 } = require("uuid")

/*
================================
CREATE REVIEW
POST /api/reviews
================================
*/

exports.createReview = async (req, res) => {
  const conn = await pool.getConnection()

  try {
    const { place_id, rating, comment } = req.body
    const userId = req.user.id

    if (!place_id || !rating) {
      return res.status(400).json({
        message: "place_id และ rating จำเป็นต้องมี"
      })
    }

    await conn.beginTransaction()

    const [result] = await conn.query(
      `INSERT INTO reviews (place_id, user_id, rating, comment)
       VALUES (?, ?, ?, ?)`,
      [place_id, userId, rating, comment]
    )

    const reviewId = result.insertId

    /*
    ================================
    UPLOAD IMAGES TO DIGITALOCEAN SPACES
    ================================
    */

    if (req.files && req.files.length > 0) {

      for (const file of req.files) {

        const ext = file.originalname.split(".").pop()

        const key =
          `reviews/${reviewId}/${uuidv4()}.${ext}`

        const params = {
          Bucket: process.env.DO_SPACES_BUCKET,
          Key: key,
          Body: file.buffer,
          ACL: "public-read",
          ContentType: file.mimetype
        }

        await s3.upload(params).promise()

        const imageUrl =
          `https://${process.env.DO_SPACES_BUCKET}.${process.env.DO_SPACES_ENDPOINT}/${key}`

        await conn.query(
          `INSERT INTO review_images (review_id, image_url)
           VALUES (?, ?)`,
          [reviewId, imageUrl]
        )
      }
    }

    /*
    ================================
    UPDATE PLACE RATING
    ================================
    */

    await conn.query(
      `
      UPDATE places
      SET
        review_count = review_count + 1,
        average_rating = (
          SELECT AVG(rating)
          FROM reviews
          WHERE place_id = ?
        )
      WHERE id = ?
      `,
      [place_id, place_id]
    )

    await conn.commit()

    res.json({
      message: "Review added successfully",
      review_id: reviewId
    })

  } catch (err) {

    await conn.rollback()

    console.error("Create review error:", err)

    res.status(500).json({
      message: "Server error"
    })

  } finally {

    conn.release()

  }
}


/*
================================
GET REVIEWS OF PLACE
GET /api/reviews/place/:placeId
================================
*/

exports.getReviews = async (req, res) => {

  try {

    const placeId = req.params.placeId

    const [reviews] = await pool.query(
      `
      SELECT
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        u.display_name,
        u.photo_url,

        (SELECT COUNT(*) FROM review_likes WHERE review_id = r.id) AS likes_count,
        (SELECT COUNT(*) FROM review_comments WHERE review_id = r.id) AS comments_count

      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.place_id = ?
      ORDER BY r.created_at DESC
      `,
      [placeId]
    )

    for (const review of reviews) {

      const [images] = await pool.query(
        `
        SELECT image_url
        FROM review_images
        WHERE review_id = ?
        `,
        [review.id]
      )

      review.images = images.map(i => i.image_url)

    }

    res.json(reviews)

  } catch (err) {

    console.error("Get reviews error:", err)

    res.status(500).json({
      message: "Server error"
    })

  }

}


/*
================================
LIKE REVIEW
POST /api/reviews/:id/like
================================
*/

exports.likeReview = async (req, res) => {

  try {

    const reviewId = req.params.id
    const userId = req.user.id

    await pool.query(
      `
      INSERT IGNORE INTO review_likes
      (review_id, user_id)
      VALUES (?, ?)
      `,
      [reviewId, userId]
    )

    res.json({
      message: "liked"
    })

  } catch (err) {

    console.error("Like review error:", err)

    res.status(500).json({
      message: "Server error"
    })

  }

}


/*
================================
UNLIKE REVIEW
DELETE /api/reviews/:id/like
================================
*/

exports.unlikeReview = async (req, res) => {

  try {

    const reviewId = req.params.id
    const userId = req.user.id

    await pool.query(
      `
      DELETE FROM review_likes
      WHERE review_id = ? AND user_id = ?
      `,
      [reviewId, userId]
    )

    res.json({
      message: "unliked"
    })

  } catch (err) {

    console.error("Unlike review error:", err)

    res.status(500).json({
      message: "Server error"
    })

  }

}


/*
================================
CHECK USER LIKED
GET /api/reviews/:id/liked
================================
*/

exports.checkLiked = async (req, res) => {

  try {

    const reviewId = req.params.id
    const userId = req.user.id

    const [rows] = await pool.query(
      `
      SELECT id
      FROM review_likes
      WHERE review_id = ? AND user_id = ?
      `,
      [reviewId, userId]
    )

    res.json({
      liked: rows.length > 0
    })

  } catch (err) {

    console.error("Check liked error:", err)

    res.status(500).json({
      message: "Server error"
    })

  }

}


/*
================================
ADD COMMENT
POST /api/reviews/:id/comments
================================
*/

exports.addComment = async (req, res) => {

  try {

    const reviewId = req.params.id
    const userId = req.user.id
    const { comment } = req.body

    if (!comment) {
      return res.status(400).json({
        message: "comment required"
      })
    }

    const [result] = await pool.query(
      `
      INSERT INTO review_comments
      (review_id, user_id, comment)
      VALUES (?, ?, ?)
      `,
      [reviewId, userId, comment]
    )

    const [rows] = await pool.query(
      `
      SELECT
        c.id,
        c.comment,
        c.created_at,
        u.display_name,
        u.photo_url
      FROM review_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
      `,
      [result.insertId]
    )

    res.json(rows[0])

  } catch (err) {

    console.error("Add comment error:", err)

    res.status(500).json({
      message: "Server error"
    })

  }

}


/*
================================
GET COMMENTS
GET /api/reviews/:id/comments
================================
*/

exports.getComments = async (req, res) => {

  try {

    const reviewId = req.params.id

    const [rows] = await pool.query(
      `
      SELECT
        c.id,
        c.comment,
        c.created_at,
        u.display_name,
        u.photo_url
      FROM review_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.review_id = ?
      ORDER BY c.created_at DESC
      `,
      [reviewId]
    )

    res.json(rows)

  } catch (err) {

    console.error("Get comments error:", err)

    res.status(500).json({
      message: "Server error"
    })

  }

}