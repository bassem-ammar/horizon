const express = require("express")
const adminController = require("../controllers/adminController")
const authMiddleware = require("../middleware/auth")

const router = express.Router()

// All admin routes require authentication
router.use(authMiddleware)

// Products routes
router.get("/products", adminController.getProducts)
router.post("/products", adminController.createProduct)
router.put("/products/:id", adminController.updateProduct)
router.delete("/products/:id", adminController.deleteProduct)

// Contacts routes
router.get("/contacts", adminController.getContacts)
router.put("/contacts/:id", adminController.updateContactStatus)

// Quotes routes
router.get("/quotes", adminController.getQuotes)
router.put("/quotes/:id", adminController.updateQuoteStatus)

// Analytics route
router.get("/analytics", adminController.getAnalytics)

module.exports = router
