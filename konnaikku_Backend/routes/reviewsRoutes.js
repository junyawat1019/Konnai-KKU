const router = require("express").Router();
const reviewsController = require("../controllers/reviewsController");
const auth = require("../middleware/auth");
const upload = require("../middlewares/upload")

router.post("/", upload.array("images", 5), reviewController.createReview)
router.get("/place/:placeId", reviewsController.getReviewsByPlace);
router.post("/", auth, reviewsController.createReview);

module.exports = router;