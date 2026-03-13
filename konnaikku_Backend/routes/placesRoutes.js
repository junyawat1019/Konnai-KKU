const router = require("express").Router();
const placesController = require("../controllers/placesController");
const auth = require("../middlewares/auth");
const upload = require("../middlewares/upload");

/* ======================
   GET ALL PLACES
====================== */

router.get("/", placesController.getPlaces);

/* ======================
   GET PLACE IMAGES
====================== */

router.get("/:id/images", placesController.getPlaceImages);

/* ======================
   GET SINGLE PLACE
====================== */

router.get("/:id", placesController.getPlace);

/* ======================
   CREATE PLACE
====================== */

router.post(
  "/",
  auth,
  upload.array("images", 10),
  placesController.createPlace
);

/* ======================
   UPDATE PLACE
====================== */

router.put(
  "/:id",
  auth,
  upload.array("images", 10),   // เพิ่มตรงนี้
  placesController.updatePlace
);

/* ======================
   DELETE PLACE
====================== */

router.delete(
  "/:id",
  auth,
  placesController.deletePlace
);

module.exports = router;