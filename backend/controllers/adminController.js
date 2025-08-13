const Product = require("../models/Product")
const ContactSubmission = require("../models/ContactSubmission")
const QuoteRequest = require("../models/QuoteRequest")

const adminController = {
  // Get all products for admin
  getProducts: async (req, res) => {
    try {
      const products = await Product.find({ isActive: true }).sort({ createdAt: -1 })

      res.json({
        products,
        total: products.length,
      })
    } catch (error) {
      console.error("Error fetching products:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Create new product
  createProduct: async (req, res) => {
    try {
      const { name, description, category, price, image_url, specifications, is_featured, stock_quantity } = req.body

      if (!name || !description || !category || price === undefined) {
        return res.status(400).json({ error: "Name, description, category, and price are required" })
      }

      const newProduct = new Product({
        name,
        description,
        category,
        price: Number.parseFloat(price),
        imageUrl: image_url || "/placeholder.svg?height=300&width=300&text=Product",
        specifications: specifications || {},
        isFeatured: is_featured || false,
        stockQuantity: Number.parseInt(stock_quantity) || 0,
      })

      await newProduct.save()

      res.status(201).json({
        product: newProduct,
        message: "Product created successfully",
      })
    } catch (error) {
      console.error("Error creating product:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Update product
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params
      const { name, description, category, price, image_url, specifications, is_featured, stock_quantity } = req.body

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        {
          name,
          description,
          category,
          price: Number.parseFloat(price),
          imageUrl: image_url,
          specifications,
          isFeatured: is_featured,
          stockQuantity: Number.parseInt(stock_quantity) || 0,
        },
        { new: true },
      )

      if (!updatedProduct) {
        return res.status(404).json({ error: "Product not found" })
      }

      res.json({
        product: updatedProduct,
        message: "Product updated successfully",
      })
    } catch (error) {
      console.error("Error updating product:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Delete product (soft delete)
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params

      const deletedProduct = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true })

      if (!deletedProduct) {
        return res.status(404).json({ error: "Product not found" })
      }

      res.json({
        message: "Product deleted successfully",
        product: deletedProduct,
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Get all contact submissions
  getContacts: async (req, res) => {
    try {
      const contacts = await ContactSubmission.find().sort({ createdAt: -1 })

      res.json({
        contacts,
        total: contacts.length,
      })
    } catch (error) {
      console.error("Error fetching contacts:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Update contact status
  updateContactStatus: async (req, res) => {
    try {
      const { id } = req.params
      const { status, notes } = req.body

      console.log("Updating contact:", id, "with status:", status) // Debug log

      if (!["new", "contacted", "resolved"].includes(status)) {
        return res.status(400).json({ error: "Invalid status. Must be: new, contacted, or resolved" })
      }

      const updateData = { status }
      if (notes !== undefined) {
        updateData.notes = notes
      }

      const updatedContact = await ContactSubmission.findByIdAndUpdate(id, updateData, { new: true })

      if (!updatedContact) {
        return res.status(404).json({ error: "Contact submission not found" })
      }

      console.log("Contact updated successfully:", updatedContact) // Debug log

      res.json({
        contact: updatedContact,
        message: "Contact status updated successfully",
      })
    } catch (error) {
      console.error("Error updating contact status:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Get all quote requests
  getQuotes: async (req, res) => {
    try {
      const quotes = await QuoteRequest.find().sort({ createdAt: -1 })

      res.json({
        quotes,
        total: quotes.length,
      })
    } catch (error) {
      console.error("Error fetching quotes:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Update quote status
  updateQuoteStatus: async (req, res) => {
    try {
      const { id } = req.params
      const { status, quoted_price, notes } = req.body

      if (!["pending", "processing", "quoted", "completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" })
      }

      const updateData = { status }
      if (notes !== undefined) {
        updateData.notes = notes
      }
      if (quoted_price !== undefined) {
        updateData.quotedPrice = Number.parseFloat(quoted_price)
      }

      const updatedQuote = await QuoteRequest.findByIdAndUpdate(id, updateData, { new: true })

      if (!updatedQuote) {
        return res.status(404).json({ error: "Quote request not found" })
      }

      res.json({
        quote: updatedQuote,
        message: "Quote status updated successfully",
      })
    } catch (error) {
      console.error("Error updating quote status:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Get analytics data
  getAnalytics: async (req, res) => {
    try {
      const [totalProducts, totalContacts, totalQuotes, bestSellingProducts] = await Promise.all([
        Product.countDocuments({ isActive: true }),
        ContactSubmission.countDocuments(),
        QuoteRequest.countDocuments(),
        Product.find({ isActive: true }).sort({ salesCount: -1 }).limit(5),
      ])

      const analytics = {
        totalProducts,
        totalContacts,
        totalQuotes,
        bestSellingProducts,
      }

      res.json(analytics)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },
}

module.exports = adminController
