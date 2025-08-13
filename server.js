const express = require("express")
const cors = require("cors")
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const path = require("path")

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 80

// Middleware
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  }),
)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect("mongodb+srv://bassdmammar:53037912@horizon.sgt9i0k.mongodb.net/?retryWrites=true&w=majority&appName=horizon")
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error("❌ MongoDB connection error:", error)
    process.exit(1)
  }
}

// Connect to MongoDB
connectDB()

// Routes
const authRoutes = require("./routes/auth")
const productRoutes = require("./routes/products")
const contactRoutes = require("./routes/contact")
const quoteRoutes = require("./routes/quotes")
const adminRoutes = require("./routes/admin")
const uploadRoutes = require("./routes/upload")
const partnerRoutes = require("./routes/partnerRoutes")

app.use("/api/auth", authRoutes)
app.use("/api/products", productRoutes)
app.use("/api/contact", contactRoutes)
app.use("/api/quote", quoteRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/admin/upload", uploadRoutes)
app.use("/api/partners", partnerRoutes)
// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Horizons World Trade Connections API is running",
    timestamp: new Date().toISOString(),
    database: "MongoDB",
    connection: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err)
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
  })
})
app.use(express.static(path.join(__dirname, "./out")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "./out", "index.html"));
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`)
  console.log(`🍃 Database: MongoDB`)
  console.log(`🔐 Admin Login: admin@horizonswtc.com / admin123`)
})

module.exports = app
