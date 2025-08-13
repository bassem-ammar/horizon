// Express middleware to serve uploaded files
// Add this to your Express server setup

const express = require("express")
const path = require("path")

// Serve static files from uploads directory
const setupStaticFiles = (app) => {
  // Serve uploaded files
  app.use("/uploads", express.static(path.join(__dirname, "../uploads")))

  // Optional: Add CORS headers for images
  app.use("/uploads", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*")
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    next()
  })
}

module.exports = { setupStaticFiles }
