const pool = require("../config/db")

exports.getCategories = async (req, res) => {
  try {

    const [rows] = await pool.query(
      "SELECT id, name FROM categories ORDER BY name ASC"
    )

    res.status(200).json({
      success: true,
      data: rows
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      success: false,
      message: "get categories error"
    })

  }
}