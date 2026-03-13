const router = require("express").Router()
const reviewsController = require("../controllers/reviewsController")
const auth = require("../middlewares/auth")
const upload = require("../middlewares/upload")

router.post(
  "/",
  auth,
  upload.array("images", 5),
  reviewsController.createReview
)

router.get("/place/:placeId", reviewsController.getReviews)

// LIKE
router.post("/:id/like", auth, reviewsController.likeReview)
router.delete("/:id/like", auth, reviewsController.unlikeReview)
router.get("/:id/liked", auth, reviewsController.checkLiked)

// COMMENT
router.post("/:id/comments", auth, reviewsController.addComment)
router.get("/:id/comments", reviewsController.getComments)

module.exports = router