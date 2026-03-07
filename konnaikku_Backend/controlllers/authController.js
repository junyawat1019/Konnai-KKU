const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto")

exports.register = async (req,res)=>{
  try{

    const {display_name,email,password,gender,birthday} = req.body;

    const hash = await bcrypt.hash(password,10);

    const id = "user_" + Date.now();

    await pool.query(
      `INSERT INTO users(id,display_name,email,password,gender,birthday)
       VALUES(?,?,?,?,?,?)`,
       [id,display_name,email,hash,gender,birthday]
    );

    res.json({message:"User created"});

  }catch(err){
    res.status(500).json(err);
  }
};

exports.login = async (req,res)=>{

  const {email,password} = req.body;

  const [rows] = await pool.query(
    "SELECT * FROM users WHERE email=?",
    [email]
  );

  if(rows.length===0){
    return res.status(400).json({message:"User not found"});
  }

  const user = rows[0];

  const match = await bcrypt.compare(password,user.password);

  if(!match){
    return res.status(400).json({message:"Wrong password"});
  }

  const token = jwt.sign(
    {id:user.id},
    process.env.JWT_SECRET,
    {expiresIn:"7d"}
  );

  res.json({token,user});
};

exports.resetPassword = async (req, res) => {
  const { email } = req.body

  try {

    const [user] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    )

    if (user.length === 0) {
      return res.status(404).json({
        message: "ไม่พบอีเมลนี้ในระบบ"
      })
    }

    const token = crypto.randomBytes(32).toString("hex")

    await db.query(
      "UPDATE users SET reset_token = ? WHERE email = ?",
      [token, email]
    )

    res.json({
      message: "ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว",
      token: token
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({
      message: "Server error"
    })
  }
}