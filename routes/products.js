const express = require("express")
const productController = require("../controllers/productController")

const router = express.Router()

// GET /api/products
router.get("/", productController.getAllProducts)
router.post("/", productController.createProduct)

// GET /api/products/:id
router.get("/:id", productController.getProductById)

module.exports = router
