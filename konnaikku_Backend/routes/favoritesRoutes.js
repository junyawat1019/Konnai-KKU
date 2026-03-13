const router = require("express").Router();
const favoritesController = require("../controllers/favoritesController");
const auth = require("../middlewares/auth");

/* add favorite */
router.post("/", auth, favoritesController.addFavorite);

/* remove favorite */
router.delete("/:placeId", auth, favoritesController.removeFavorite);

/* user favorites */
router.get("/user/:userId", favoritesController.getUserFavorites);

module.exports = router;