const router = require("express").Router();
const usersController = require("../controllers/usersController");
const auth = require("../middleware/auth");

router.get("/:id", usersController.getUser);
router.put("/profile", auth, usersController.updateProfile);
router.get("/:id/reviews", usersController.getUserReviews);

module.exports = router;