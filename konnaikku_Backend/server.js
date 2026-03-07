const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const usersRoutes = require("./routes/usersRoutes");
const placesRoutes = require("./routes/placesRoutes");
const reviewsRoutes = require("./routes/reviewsRoutes");
const favoritesRoutes = require("./routes/favoritesRoutes");
const followsRoutes = require("./routes/followsRoutes");
const uploadRoutes = require('./routes/uploadRoutes')

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/favorites", favoritesRoutes);
app.use("/api/follows", followsRoutes);
app.use('/api/upload', uploadRoutes)

app.get("/", (req,res)=>{
  res.send("Konnai API Running");
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});