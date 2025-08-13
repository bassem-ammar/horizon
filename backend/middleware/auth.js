const jwt = require("jsonwebtoken")
const AdminUser = require("../models/AdminUser")

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied. No token provided." })
    }

    const token = authHeader.substring(7)

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")

      // Verify admin exists in database
      const admin = await AdminUser.findById(decoded.adminId)

      if (!admin || !admin.isActive) {
        return res.status(401).json({ error: "Invalid token. Admin not found." })
      }

      req.admin = {
        id: admin._id,
        email: admin.email,
        name: admin.name,
      }
      next()
    } catch (jwtError) {
      return res.status(401).json({ error: "Invalid token." })
    }
  } catch (error) {
    console.error("Auth middleware error:", error)
    res.status(500).json({ error: "Internal server error" })
  }
}

module.exports = authMiddleware
