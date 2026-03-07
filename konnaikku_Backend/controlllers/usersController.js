const pool = require("../config/db");

exports.getUser = async (req,res)=>{

  const [rows] = await pool.query(
    "SELECT * FROM users WHERE id=?",
    [req.params.id]
  );

  res.json(rows[0]);
};

exports.updateProfile = async (req,res)=>{

  const {display_name,about_me,phone_number,photo_url} = req.body;

  await pool.query(
    `UPDATE users
     SET display_name=?,about_me=?,phone_number=?,photo_url=?
     WHERE id=?`,
     [display_name,about_me,phone_number,photo_url,req.user.id]
  );

  res.json({message:"Profile updated"});
};

exports.getUserReviews = async (req,res)=>{

  const [rows] = await pool.query(
    `SELECT r.*,p.name place_name
     FROM reviews r
     JOIN places p ON r.place_id=p.id
     WHERE r.user_id=?
     ORDER BY r.created_at DESC`,
     [req.params.id]
  );

  res.json(rows);
};