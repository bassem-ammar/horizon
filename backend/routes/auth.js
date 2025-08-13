const express = require("express")
const authController = require("../controllers/authController")

const router = express.Router()

// POST /api/auth/login
router.post("/login", authController.login)

// POST /api/auth/register (for creating admin users)
router.post("/register", authController.register)

// GET /api/auth/verify
router.get("/verify", authController.verifyToken)

// POST /api/auth/change-password
router.post("/change-password", authController.changePassword)

// POST /api/auth/forgot-password
router.post("/forgot-password", authController.forgotPassword)

// GET /api/auth/verify-reset-token
router.get("/verify-reset-token", authController.verifyResetToken)

// POST /api/auth/reset-password
router.post("/reset-password", authController.resetPassword)

module.exports = router
