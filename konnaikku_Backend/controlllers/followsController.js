const pool = require("../config/db");

exports.followUser = async (req,res)=>{

  const {user_id} = req.body;

  await pool.query(
    `INSERT IGNORE INTO follows(follower_id,following_id)
     VALUES(?,?)`,
     [req.user.id,user_id]
  );

  res.json({message:"Followed"});
};

exports.unfollowUser = async (req,res)=>{

  const {user_id} = req.body;

  await pool.query(
    `DELETE FROM follows
     WHERE follower_id=? AND following_id=?`,
     [req.user.id,user_id]
  );

  res.json({message:"Unfollowed"});
};

exports.getFollowers = async (req,res)=>{

  const [rows] = await pool.query(
    `SELECT u.id,u.display_name,u.photo_url
     FROM follows f
     JOIN users u ON f.follower_id=u.id
     WHERE f.following_id=?`,
     [req.params.userId]
  );

  res.json(rows);
};

exports.getFollowing = async (req,res)=>{

  const [rows] = await pool.query(
    `SELECT u.id,u.display_name,u.photo_url
     FROM follows f
     JOIN users u ON f.following_id=u.id
     WHERE f.follower_id=?`,
     [req.params.userId]
  );

  res.json(rows);
};