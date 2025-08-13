const express = require("express")
const quoteController = require("../controllers/quoteController")

const router = express.Router()

// POST /api/quote
router.post("/", quoteController.submitQuote)
router.get("/", quoteController.getAllQuotes)
router.put("/:id", quoteController.updateQuote)

module.exports = router
