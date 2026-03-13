const express = require("express")
const router = express.Router()

const auth = require("../middlewares/auth")
const usersController = require("../controllers/usersController")

router.get("/me", auth, usersController.getMe)
router.put("/me", auth, usersController.updateProfile)

router.get("/:id", usersController.getUser)
router.get("/:id/reviews", usersController.getUserReviews)

router.get("/:id/places", usersController.getUserPlaces)
router.get("/:id/favorites", usersController.getUserFavorites)
router.get("/:id/followers", usersController.getFollowers)

router.get("/:id/photos", usersController.getUserPhotos)
router.get("/:id/activity", usersController.getUserActivity)

module.exports = router