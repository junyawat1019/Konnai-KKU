const pool = require("../config/db");

exports.createReview = async (req,res)=>{

  const {place_id,rating,comment} = req.body;

  const userId=req.user.id;

  await pool.query(
    `INSERT INTO reviews(place_id,user_id,rating,comment)
     VALUES(?,?,?,?)`,
     [place_id,userId,rating,comment]
  );

  await pool.query(`
    UPDATE places
    SET review_count = review_count + 1,
    average_rating = (
      SELECT AVG(rating)
      FROM reviews
      WHERE place_id=?
    )
    WHERE id=?
  `,[place_id,place_id]);

  res.json({message:"Review added"});
};

exports.getReviews = async (req,res)=>{

  const placeId=req.params.placeId;

  const [rows] = await pool.query(`
    SELECT r.*,u.display_name,u.photo_url
    FROM reviews r
    JOIN users u ON r.user_id=u.id
    WHERE r.place_id=?
    ORDER BY r.created_at DESC
  `,[placeId]);

  res.json(rows);
};