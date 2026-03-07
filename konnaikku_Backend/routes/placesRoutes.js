const router = require("express").Router();
const placesController = require("../controllers/placesController");
const auth = require("../middleware/auth");

router.get("/", placesController.getPlaces);
router.get("/:id", placesController.getPlace);
router.post("/", auth, placesController.createPlace);

router.get("/:id/images", placesController.getPlaceImages);

module.exports = router;