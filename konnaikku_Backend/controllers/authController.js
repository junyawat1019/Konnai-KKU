const pool = require("../config/db")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")

/* ======================
REGISTER
====================== */

exports.register = async (req, res) => {

  try {

    const displayName = req.body.displayName?.trim()
    const email = req.body.email
    const password = req.body.password
    const gender = req.body.gender || null
    const birthday = req.body.birthday || null

    if (!displayName || !email || !password) {
      return res.status(400).json({
        message: "กรอกข้อมูลไม่ครบ"
      })
    }

    const [exist] = await pool.query(
      "SELECT id FROM users WHERE email=?",
      [email]
    )

    if (exist.length > 0) {
      return res.status(400).json({
        message: "อีเมลนี้ถูกใช้งานแล้ว"
      })
    }

    const hash = await bcrypt.hash(password, 10)

    const id = "user_" + Date.now()

    await pool.query(
      `INSERT INTO users
      (id,display_name,email,password,gender,birthday)
      VALUES(?,?,?,?,?,?)`,
      [id, displayName, email, hash, gender, birthday]
    )

    const token = jwt.sign(
      { id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      message: "สมัครสมาชิกสำเร็จ",
      token,
      user: {
        id,
        displayName,
        email,
        photoURL: null,
        gender,
        birthday
      }
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      message: "Server error"
    })

  }

}

/* ======================
LOGIN
====================== */

exports.login = async (req, res) => {

  try {

    const { email, password } = req.body

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email=?",
      [email]
    )

    if (rows.length === 0) {
      return res.status(400).json({
        message: "ไม่พบผู้ใช้งาน"
      })
    }

    const user = rows[0]

    const match = await bcrypt.compare(password, user.password)

    if (!match) {
      return res.status(400).json({
        message: "รหัสผ่านไม่ถูกต้อง"
      })
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.json({
      token,
      user: {
        id: user.id,
        displayName: user.display_name,
        email: user.email,
        photoURL: user.photo_url,
        gender: user.gender,
        birthday: user.birthday,
        aboutMe: user.about_me,
        phoneNumber: user.phone_number,
        reviewsCount: user.reviews_count,
        followersCount: user.followers_count,
        followingCount: user.following_count
      }
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message: "Server error"
    })

  }

}

/* ======================
RESET PASSWORD
====================== */

exports.resetPassword = async (req, res) => {

  const { email } = req.body

  try {

    const [user] = await pool.query(
      "SELECT id FROM users WHERE email=?",
      [email]
    )

    if (user.length === 0) {
      return res.status(404).json({
        message: "ไม่พบอีเมลนี้ในระบบ"
      })
    }

    const token = crypto.randomBytes(32).toString("hex")

    await pool.query(
      "UPDATE users SET reset_token=? WHERE email=?",
      [token, email]
    )

    res.json({
      message: "ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว"
    })

  } catch (error) {

    console.error(error)

    res.status(500).json({
      message: "Server error"
    })

  }

}