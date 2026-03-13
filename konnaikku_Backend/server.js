const express = require("express");
const cors = require("cors");
require("dotenv").config();

const path = require("path");

const db = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/usersRoutes");
const placesRoutes = require("./routes/placesRoutes");
const reviewsRoutes = require("./routes/reviewsRoutes");
const favoritesRoutes = require("./routes/favoritesRoutes");
const followsRoutes = require("./routes/followsRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const categoriesRoutes = require("./routes/categoriesRoutes");

const app = express();

/* ======================
   Middleware
====================== */

app.use(cors());
app.use(express.json());

/* ======================
   Static Files (สำคัญ)
====================== */

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

/* ======================
   Routes
====================== */

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/follows", followsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/categories", categoriesRoutes);

/* ======================
   Test Route
====================== */

app.get("/", (req, res) => {
  res.send("Konnai API Running");
});

/* ======================
   Start Server
====================== */

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    await db.query("SELECT 1");
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log("Server running on port " + PORT);
    });

  } catch (err) {
    console.error("Database connection failed:", err);
  }
}

startServer();