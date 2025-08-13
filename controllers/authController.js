const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const nodemailer = require("nodemailer")
const AdminUser = require("../models/AdminUser")

const createEmailTransporter = () => {
  // For development, you can use Gmail or other SMTP services
  // For production, use services like SendGrid, AWS SES, or Mailgun
  return nodemailer.createTransport({
    service: "gmail", // or your preferred email service
    auth: {
      user: 'bassdmammar@gmail.com', // your email
      pass: '53037912', // your app password
    },
  })
}

const sendResetEmail = async (email, resetUrl, name) => {
  try {
    const transporter = createEmailTransporter()

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${name || "Admin"},</p>
          <p>You requested a password reset for your admin account. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">This is an automated email, please do not reply.</p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error("Email sending error:", error)
    return false
  }
}

const authController = {
  // Login admin user
  login: async (req, res) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" })
      }

      // Find admin user
      const admin = await AdminUser.findOne({ email, isActive: true })

      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" })
      }

      // Verify password
      const isValidPassword = await admin.comparePassword(password)

      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid credentials" })
      }

      // Generate JWT token
      const token = jwt.sign({ adminId: admin._id, email: admin.email }, process.env.JWT_SECRET || "your-secret-key", {
        expiresIn: "24h",
      })

      res.json({
        token,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
        },
      })
    } catch (error) {
      console.error("Login error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Register new admin user
  register: async (req, res) => {
    try {
      const { email, password, name } = req.body

      if (!email || !password || !name) {
        return res.status(400).json({ error: "Email, password, and name are required" })
      }

      // Check if admin already exists
      const existingAdmin = await AdminUser.findOne({ email })

      if (existingAdmin) {
        return res.status(400).json({ error: "Admin user already exists" })
      }

      // Create admin user
      const newAdmin = new AdminUser({
        email,
        password,
        name,
      })

      await newAdmin.save()

      res.status(201).json({
        message: "Admin user created successfully",
        admin: {
          id: newAdmin._id,
          email: newAdmin.email,
          name: newAdmin.name,
          created_at: newAdmin.createdAt,
        },
      })
    } catch (error) {
      console.error("Registration error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Verify JWT token
  verifyToken: async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1]

      if (!token) {
        return res.status(401).json({ error: "No token provided" })
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")

      // Find admin user
      const admin = await AdminUser.findById(decoded.adminId)

      if (!admin || !admin.isActive) {
        return res.status(401).json({ error: "Invalid token" })
      }

      res.json({
        valid: true,
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
        },
      })
    } catch (error) {
      console.error("Token verification error:", error)
      res.status(401).json({ error: "Invalid token" })
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body
      const token = req.headers.authorization?.split(" ")[1]

      if (!token) {
        return res.status(401).json({ error: "No token provided" })
      }

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" })
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters long" })
      }

      // Verify token and get admin ID
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key")

      // Find admin user
      const admin = await AdminUser.findById(decoded.adminId)

      if (!admin || !admin.isActive) {
        return res.status(401).json({ error: "Invalid token" })
      }

      // Verify current password
      const isValidPassword = await admin.comparePassword(currentPassword)

      if (!isValidPassword) {
        return res.status(400).json({ error: "Current password is incorrect" })
      }

      // Check if new password is different from current
      const isSamePassword = await admin.comparePassword(newPassword)
      if (isSamePassword) {
        return res.status(400).json({ error: "New password must be different from current password" })
      }

      // Update password
      admin.password = newPassword
      await admin.save()

      res.json({
        message: "Password changed successfully",
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
        },
      })
    } catch (error) {
      console.error("Change password error:", error)
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ error: "Invalid token" })
      }
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Forgot password - generate reset token and send email
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body

      if (!email) {
        return res.status(400).json({ error: "Email is required" })
      }

      // Find admin user
      const admin = await AdminUser.findOne({ email, isActive: true })

      if (!admin) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." })
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString("hex")
      const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

      // Save reset token to admin user
      admin.resetPasswordToken = resetToken
      admin.resetPasswordExpires = resetTokenExpiry
      await admin.save()

      const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/admin/reset-password?token=${resetToken}`

      const emailSent = await sendResetEmail(admin.email, resetUrl, admin.name)

      if (!emailSent) {
        console.error("Failed to send reset email to:", admin.email)
        // Still return success message for security (don't reveal if email exists)
      } else {
        console.log(`Password reset email sent to: ${admin.email}`)
      }

      res.json({ message: "If an account with that email exists, a password reset link has been sent." })
    } catch (error) {
      console.error("Forgot password error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Verify reset token
  verifyResetToken: async (req, res) => {
    try {
      const { token } = req.query

      if (!token) {
        return res.status(400).json({ error: "Reset token is required" })
      }

      // Find admin user with valid reset token
      const admin = await AdminUser.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
        isActive: true,
      })

      if (!admin) {
        return res.status(400).json({ error: "Invalid or expired reset token" })
      }

      res.json({ message: "Reset token is valid" })
    } catch (error) {
      console.error("Verify reset token error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Reset password with token
  resetPassword: async (req, res) => {
    try {
      const { token, password } = req.body

      if (!token || !password) {
        return res.status(400).json({ error: "Reset token and new password are required" })
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters long" })
      }

      // Find admin user with valid reset token
      const admin = await AdminUser.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() },
        isActive: true,
      })

      if (!admin) {
        return res.status(400).json({ error: "Invalid or expired reset token" })
      }

      // Update password and clear reset token
      admin.password = password
      admin.resetPasswordToken = undefined
      admin.resetPasswordExpires = undefined
      await admin.save()

      res.json({ message: "Password has been reset successfully" })
    } catch (error) {
      console.error("Reset password error:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },
}

module.exports = authController
