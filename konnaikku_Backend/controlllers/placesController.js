const pool = require("../config/db");

exports.getPlaces = async (req,res)=>{

  const {category,province} = req.query;

  let sql = `
  SELECT p.*,c.name category_name
  FROM places p
  LEFT JOIN categories c ON p.category_id=c.id
  WHERE 1=1
  `;

  const params=[];

  if(category){
    sql+=" AND p.category_id=?";
    params.push(category);
  }

  if(province){
    sql+=" AND p.province=?";
    params.push(province);
  }

  sql+=" ORDER BY p.average_rating DESC";

  const [rows] = await pool.query(sql,params);

  res.json(rows);
};

exports.getPlace = async (req,res)=>{

  const id=req.params.id;

  const [rows] = await pool.query(
    `SELECT * FROM places WHERE id=?`,
    [id]
  );

  res.json(rows[0]);
};

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
    lng
  } = req.body;

  const userId=req.user.id;

  const [result] = await pool.query(
    `INSERT INTO places
    (name,description,category_id,price_level,address,district,province,lat,lng,created_by)
    VALUES(?,?,?,?,?,?,?,?,?,?)`,
    [name,description,category_id,price_level,address,district,province,lat,lng,userId]
  );

  res.json({id:result.insertId});
};