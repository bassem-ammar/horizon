const Product = require("../models/Product")

const productController = {
  // Get all products with optional category filter
  getAllProducts: async (req, res) => {
    try {
      const { category, featured, search, limit, page } = req.query
      const query = { isActive: true }

      // Filter by category
      if (category) {
        query.category = category
      }

      // Filter by featured status
      if (featured === "true") {
        query.isFeatured = true
      }

      // Search functionality
      if (search) {
        query.$or = [{ name: { $regex: search, $options: "i" } }, { description: { $regex: search, $options: "i" } }]
      }

      // Pagination
      const pageNum = Number.parseInt(page) || 1
      const limitNum = Number.parseInt(limit) || 50
      const skip = (pageNum - 1) * limitNum

      const products = await Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum)

      const total = await Product.countDocuments(query)

      res.json({
        products,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + products.length < total,
      })
    } catch (error) {
      console.error("Error fetching products:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Get product by ID
  getProductById: async (req, res) => {
    try {
      const { id } = req.params

      const product = await Product.findById(id)

      if (!product || !product.isActive) {
        return res.status(404).json({ error: "Product not found" })
      }

      res.json({
        product,
      })
    } catch (error) {
      console.error("Error fetching product:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Create new product (Admin only)
  createProduct: async (req, res) => {
    try {
      const {
        name,
        description,
        category,
        price,
        image_url,
        images,
        specifications,
        is_featured,
        moq_by_quantity,
        moq_by_weight,
        min_quantity,
        min_weight,
        quantity_unit,
        weight_unit,
      } = req.body

      // Validation
      if (!name || !description || !category || !price) {
        return res.status(400).json({
          error: "Missing required fields: name, description, category, and price are required",
        })
      }

      // Validate MOQ settings
      if (!moq_by_quantity && !moq_by_weight) {
        return res.status(400).json({
          error: "At least one MOQ type (by quantity or by weight) must be selected",
        })
      }

      if (moq_by_quantity && (!min_quantity || min_quantity <= 0)) {
        return res.status(400).json({
          error: "Minimum quantity must be greater than 0 when MOQ by quantity is enabled",
        })
      }

      if (moq_by_weight && (!min_weight || min_weight <= 0)) {
        return res.status(400).json({
          error: "Minimum weight must be greater than 0 when MOQ by weight is enabled",
        })
      }

      // Process images array
      let processedImages = []
      if (images && Array.isArray(images) && images.length > 0) {
        processedImages = images.map((img, index) => ({
          url: img.url || img,
          alt: img.alt || `${name} - Image ${index + 1}`,
          isPrimary: img.isPrimary || index === 0,
          order: img.order || index,
        }))
      } else if (image_url) {
        // Fallback to single image for backward compatibility
        processedImages = [
          {
            url: image_url,
            alt: `${name} - Main Image`,
            isPrimary: true,
            order: 0,
          },
        ]
      }

      // Create product data object
      const productData = {
        name: name.trim(),
        description: description.trim(),
        category,
        price: Number.parseFloat(price),
        images: processedImages,
        imageUrl:
          processedImages.length > 0 ? processedImages[0].url : "/placeholder.svg?height=300&width=300&text=Product",
        specifications: specifications || {},
        isFeatured: is_featured || false,
        moqByQuantity: moq_by_quantity || false,
        moqByWeight: moq_by_weight || false,
        quantityUnit: quantity_unit || "pieces",
        weightUnit: weight_unit || "kg",
      }

      // Add minimum values only if MOQ types are enabled
      if (moq_by_quantity) {
        productData.minQuantity = Number.parseFloat(min_quantity)
      }

      if (moq_by_weight) {
        productData.minWeight = Number.parseFloat(min_weight)
      }

      const product = new Product(productData)
      await product.save()

      res.status(201).json({
        message: "Product created successfully",
        product,
      })
    } catch (error) {
      console.error("Error creating product:", error)
      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation error",
          details: error.message,
        })
      }
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Update product (Admin only)
  updateProduct: async (req, res) => {
    try {
      const { id } = req.params
      const {
        name,
        description,
        category,
        price,
        image_url,
        images,
        specifications,
        is_featured,
        moq_by_quantity,
        moq_by_weight,
        min_quantity,
        min_weight,
        quantity_unit,
        weight_unit,
      } = req.body

      const product = await Product.findById(id)
      if (!product) {
        return res.status(404).json({ error: "Product not found" })
      }

      // Validation
      if (name && !name.trim()) {
        return res.status(400).json({ error: "Product name cannot be empty" })
      }

      if (description && !description.trim()) {
        return res.status(400).json({ error: "Product description cannot be empty" })
      }

      if (price && (isNaN(price) || Number.parseFloat(price) < 0)) {
        return res.status(400).json({ error: "Price must be a valid positive number" })
      }

      // Validate MOQ settings
      const updatedMoqByQuantity = moq_by_quantity !== undefined ? moq_by_quantity : product.moqByQuantity
      const updatedMoqByWeight = moq_by_weight !== undefined ? moq_by_weight : product.moqByWeight

      if (!updatedMoqByQuantity && !updatedMoqByWeight) {
        return res.status(400).json({
          error: "At least one MOQ type (by quantity or by weight) must be selected",
        })
      }

      if (updatedMoqByQuantity && min_quantity !== undefined && min_quantity <= 0) {
        return res.status(400).json({
          error: "Minimum quantity must be greater than 0 when MOQ by quantity is enabled",
        })
      }

      if (updatedMoqByWeight && min_weight !== undefined && min_weight <= 0) {
        return res.status(400).json({
          error: "Minimum weight must be greater than 0 when MOQ by weight is enabled",
        })
      }

      // Update fields
      if (name) product.name = name.trim()
      if (description) product.description = description.trim()
      if (category) product.category = category
      if (price !== undefined) product.price = Number.parseFloat(price)
      if (specifications !== undefined) product.specifications = specifications
      if (is_featured !== undefined) product.isFeatured = is_featured
      if (moq_by_quantity !== undefined) product.moqByQuantity = moq_by_quantity
      if (moq_by_weight !== undefined) product.moqByWeight = moq_by_weight
      if (quantity_unit) product.quantityUnit = quantity_unit
      if (weight_unit) product.weightUnit = weight_unit

      // Handle images update
      if (images !== undefined) {
        if (Array.isArray(images) && images.length > 0) {
          product.images = images.map((img, index) => ({
            url: img.url || img,
            alt: img.alt || `${product.name} - Image ${index + 1}`,
            isPrimary: img.isPrimary || index === 0,
            order: img.order || index,
          }))
        } else if (image_url) {
          // Fallback to single image
          product.images = [
            {
              url: image_url,
              alt: `${product.name} - Main Image`,
              isPrimary: true,
              order: 0,
            },
          ]
        }
      } else if (image_url !== undefined) {
        // Update single image for backward compatibility
        if (product.images && product.images.length > 0) {
          product.images[0].url = image_url
        } else {
          product.images = [
            {
              url: image_url,
              alt: `${product.name} - Main Image`,
              isPrimary: true,
              order: 0,
            },
          ]
        }
      }

      // Update minimum values based on MOQ settings
      if (product.moqByQuantity && min_quantity !== undefined) {
        product.minQuantity = Number.parseFloat(min_quantity)
      } else if (!product.moqByQuantity) {
        product.minQuantity = null
      }

      if (product.moqByWeight && min_weight !== undefined) {
        product.minWeight = Number.parseFloat(min_weight)
      } else if (!product.moqByWeight) {
        product.minWeight = null
      }

      await product.save()

      res.json({
        message: "Product updated successfully",
        product,
      })
    } catch (error) {
      console.error("Error updating product:", error)
      if (error.name === "ValidationError") {
        return res.status(400).json({
          error: "Validation error",
          details: error.message,
        })
      }
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Delete product (Admin only) - Soft delete
  deleteProduct: async (req, res) => {
    try {
      const { id } = req.params

      const product = await Product.findById(id)
      if (!product) {
        return res.status(404).json({ error: "Product not found" })
      }

      // Soft delete by setting isActive to false
      product.isActive = false
      await product.save()

      res.json({
        message: "Product deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Toggle featured status (Admin only)
  toggleFeatured: async (req, res) => {
    try {
      const { id } = req.params

      const product = await Product.findById(id)
      if (!product || !product.isActive) {
        return res.status(404).json({ error: "Product not found" })
      }

      product.isFeatured = !product.isFeatured
      await product.save()

      res.json({
        message: `Product ${product.isFeatured ? "featured" : "unfeatured"} successfully`,
        product,
      })
    } catch (error) {
      console.error("Error toggling featured status:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Get featured products
  getFeaturedProducts: async (req, res) => {
    try {
      const { category, limit } = req.query
      const query = { isActive: true, isFeatured: true }

      if (category) {
        query.category = category
      }

      const limitNum = Number.parseInt(limit) || 10

      const products = await Product.find(query).sort({ salesCount: -1, createdAt: -1 }).limit(limitNum)

      res.json({
        products,
        total: products.length,
      })
    } catch (error) {
      console.error("Error fetching featured products:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Get products by category with MOQ information
  getProductsByCategory: async (req, res) => {
    try {
      const { category } = req.params
      const { limit, page, sort } = req.query

      const query = { isActive: true, category }

      // Pagination
      const pageNum = Number.parseInt(page) || 1
      const limitNum = Number.parseInt(limit) || 20
      const skip = (pageNum - 1) * limitNum

      // Sorting
      let sortOption = { createdAt: -1 }
      if (sort === "price_asc") sortOption = { price: 1 }
      else if (sort === "price_desc") sortOption = { price: -1 }
      else if (sort === "name_asc") sortOption = { name: 1 }
      else if (sort === "name_desc") sortOption = { name: -1 }
      else if (sort === "popular") sortOption = { salesCount: -1 }

      const products = await Product.find(query).sort(sortOption).skip(skip).limit(limitNum)

      const total = await Product.countDocuments(query)

      // Add MOQ validation info to each product
      const productsWithMOQ = products.map((product) => {
        const productObj = product.toJSON()

        // Add MOQ summary
        productObj.moq_info = {
          has_quantity_moq: product.moqByQuantity,
          has_weight_moq: product.moqByWeight,
          min_quantity_display: product.moqByQuantity ? `${product.minQuantity} ${product.quantityUnit}` : null,
          min_weight_display: product.moqByWeight ? `${product.minWeight} ${product.weightUnit}` : null,
        }

        return productObj
      })

      res.json({
        products: productsWithMOQ,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
        hasMore: skip + products.length < total,
        category,
      })
    } catch (error) {
      console.error("Error fetching products by category:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Validate MOQ for a product
  validateMOQ: async (req, res) => {
    try {
      const { id } = req.params
      const { quantity, weight } = req.body

      const product = await Product.findById(id)
      if (!product || !product.isActive) {
        return res.status(404).json({ error: "Product not found" })
      }

      const errors = []
      let isValid = true

      // Validate quantity MOQ
      if (product.moqByQuantity && product.minQuantity) {
        if (!quantity || quantity < product.minQuantity) {
          errors.push(`Minimum order quantity is ${product.minQuantity} ${product.quantityUnit}`)
          isValid = false
        }
      }

      // Validate weight MOQ
      if (product.moqByWeight && product.minWeight) {
        if (!weight || weight < product.minWeight) {
          errors.push(`Minimum order weight is ${product.minWeight} ${product.weightUnit}`)
          isValid = false
        }
      }

      res.json({
        isValid,
        errors,
        message: isValid ? "Order meets minimum requirements" : "Order does not meet minimum requirements",
        moq_requirements: {
          quantity_required: product.moqByQuantity,
          weight_required: product.moqByWeight,
          min_quantity: product.minQuantity,
          quantity_unit: product.quantityUnit,
          min_weight: product.minWeight,
          weight_unit: product.weightUnit,
        },
      })
    } catch (error) {
      console.error("Error validating MOQ:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Get MOQ statistics (Admin only)
  getMOQStats: async (req, res) => {
    try {
      const stats = await Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            quantityMOQProducts: {
              $sum: { $cond: ["$moqByQuantity", 1, 0] },
            },
            weightMOQProducts: {
              $sum: { $cond: ["$moqByWeight", 1, 0] },
            },
            bothMOQProducts: {
              $sum: {
                $cond: [{ $and: ["$moqByQuantity", "$moqByWeight"] }, 1, 0],
              },
            },
            avgMinQuantity: {
              $avg: {
                $cond: ["$moqByQuantity", "$minQuantity", null],
              },
            },
            avgMinWeight: {
              $avg: {
                $cond: ["$moqByWeight", "$minWeight", null],
              },
            },
          },
        },
      ])

      const categoryStats = await Product.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: "$category",
            totalProducts: { $sum: 1 },
            quantityMOQProducts: {
              $sum: { $cond: ["$moqByQuantity", 1, 0] },
            },
            weightMOQProducts: {
              $sum: { $cond: ["$moqByWeight", 1, 0] },
            },
          },
        },
      ])

      res.json({
        overall: stats[0] || {
          totalProducts: 0,
          quantityMOQProducts: 0,
          weightMOQProducts: 0,
          bothMOQProducts: 0,
          avgMinQuantity: 0,
          avgMinWeight: 0,
        },
        byCategory: categoryStats,
      })
    } catch (error) {
      console.error("Error fetching MOQ stats:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Upload multiple images for a product
  uploadProductImages: async (req, res) => {
    try {
      const { id } = req.params
      const files = req.files

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No images provided" })
      }

      const product = await Product.findById(id)
      if (!product) {
        return res.status(404).json({ error: "Product not found" })
      }

      // Process uploaded files and create image objects
      const newImages = files.map((file, index) => ({
        url: `/uploads/${file.filename}`,
        alt: `${product.name} - Image ${(product.images?.length || 0) + index + 1}`,
        isPrimary: (product.images?.length || 0) === 0 && index === 0,
        order: (product.images?.length || 0) + index,
      }))

      // Add new images to existing ones
      product.images = [...(product.images || []), ...newImages]
      await product.save()

      res.json({
        message: "Images uploaded successfully",
        images: newImages,
        product,
      })
    } catch (error) {
      console.error("Error uploading product images:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Delete a specific image from a product
  deleteProductImage: async (req, res) => {
    try {
      const { id, imageIndex } = req.params

      const product = await Product.findById(id)
      if (!product) {
        return res.status(404).json({ error: "Product not found" })
      }

      if (!product.images || product.images.length === 0) {
        return res.status(400).json({ error: "No images found for this product" })
      }

      const index = Number.parseInt(imageIndex)
      if (index < 0 || index >= product.images.length) {
        return res.status(400).json({ error: "Invalid image index" })
      }

      // Remove the image at the specified index
      product.images.splice(index, 1)

      // If we removed the primary image, make the first remaining image primary
      if (product.images.length > 0 && !product.images.some((img) => img.isPrimary)) {
        product.images[0].isPrimary = true
      }

      await product.save()

      res.json({
        message: "Image deleted successfully",
        product,
      })
    } catch (error) {
      console.error("Error deleting product image:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },

  // Set primary image for a product
  setPrimaryImage: async (req, res) => {
    try {
      const { id, imageIndex } = req.params

      const product = await Product.findById(id)
      if (!product) {
        return res.status(404).json({ error: "Product not found" })
      }

      if (!product.images || product.images.length === 0) {
        return res.status(400).json({ error: "No images found for this product" })
      }

      const index = Number.parseInt(imageIndex)
      if (index < 0 || index >= product.images.length) {
        return res.status(400).json({ error: "Invalid image index" })
      }

      // Set all images to non-primary
      product.images.forEach((img) => (img.isPrimary = false))

      // Set the selected image as primary
      product.images[index].isPrimary = true

      await product.save()

      res.json({
        message: "Primary image updated successfully",
        product,
      })
    } catch (error) {
      console.error("Error setting primary image:", error)
      res.status(500).json({ error: "Internal server error" })
    }
  },
}

module.exports = productController
