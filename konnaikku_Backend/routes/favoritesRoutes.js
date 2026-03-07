const router = require("express").Router();
const favoritesController = require("../controllers/favoritesController");
const auth = require("../middleware/auth");

router.post("/", auth, favoritesController.addFavorite);
router.delete("/", auth, favoritesController.removeFavorite);

router.get("/user/:userId", favoritesController.getUserFavorites);

module.exports = router;