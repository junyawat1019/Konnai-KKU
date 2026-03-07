const router = require("express").Router();
const authController = require("../controllers/authController");
const express = require("express")

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/reset-password", authController.resetPassword)

module.exports = router;