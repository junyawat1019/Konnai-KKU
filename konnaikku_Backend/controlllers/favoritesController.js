const pool = require("../config/db");

exports.addFavorite = async (req,res)=>{

  const {place_id} = req.body;

  await pool.query(
    `INSERT IGNORE INTO favorites(user_id,place_id)
     VALUES(?,?)`,
     [req.user.id,place_id]
  );

  res.json({message:"Added to favorites"});
};

exports.removeFavorite = async (req,res)=>{

  const {place_id} = req.body;

  await pool.query(
    `DELETE FROM favorites
     WHERE user_id=? AND place_id=?`,
     [req.user.id,place_id]
  );

  res.json({message:"Removed"});
};

exports.getUserFavorites = async (req,res)=>{

  const [rows] = await pool.query(
    `SELECT p.*
     FROM favorites f
     JOIN places p ON f.place_id=p.id
     WHERE f.user_id=?`,
     [req.params.userId]
  );

  res.json(rows);
};