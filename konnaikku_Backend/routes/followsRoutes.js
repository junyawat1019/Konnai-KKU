const router = require("express").Router();
const followsController = require("../controllers/followsController");
const auth = require("../middlewares/auth");

router.post("/", auth, followsController.followUser);
router.delete("/", auth, followsController.unfollowUser);

router.get("/followers/:userId", followsController.getFollowers);
router.get("/following/:userId", followsController.getFollowing);

module.exports = router;