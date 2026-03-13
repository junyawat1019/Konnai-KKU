const pool = require("../config/db");

/* ======================
   ADD FAVORITE
====================== */

exports.addFavorite = async (req,res)=>{

  try{

    const { place_id } = req.body;

    await pool.query(
      `INSERT IGNORE INTO favorites(user_id,place_id)
       VALUES(?,?)`,
      [req.user.id, place_id]
    );

    res.json({message:"Added to favorites"});

  }catch(err){

    console.error(err);
    res.status(500).json({error:"Server error"});

  }

};

/* ======================
   REMOVE FAVORITE
====================== */

exports.removeFavorite = async (req,res)=>{

  try{

    const { placeId } = req.params;

    await pool.query(
      `DELETE FROM favorites
       WHERE user_id=? AND place_id=?`,
      [req.user.id, placeId]
    );

    res.json({message:"Removed"});

  }catch(err){

    console.error(err);
    res.status(500).json({error:"Server error"});

  }

};

/* ======================
   GET USER FAVORITES
====================== */

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
      JOIN places p ON f.place_id = p.id
      WHERE f.user_id=?`,

      [req.params.userId]

    );

    res.json(rows);

  }catch(err){

    console.error(err);
    res.status(500).json({error:"Server error"});

  }

};