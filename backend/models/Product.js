const mongoose = require("mongoose")

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["alimentary", "gas_oil"],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    // Updated to support multiple images
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
          default: "",
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],
    // Keep imageUrl for backward compatibility, will be the primary image
    imageUrl: {
      type: String,
      default: "/placeholder.svg?height=300&width=300&text=Product",
    },
    specifications: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // MOQ (Minimum Order Quantity) options
    moqByQuantity: {
      type: Boolean,
      default: false,
    },
    moqByWeight: {
      type: Boolean,
      default: false,
    },
    // Minimum quantity settings
    minQuantity: {
      type: Number,
      min: 0,
      default: null,
    },
    minWeight: {
      type: Number,
      min: 0,
      default: null,
    },
    quantityUnit: {
      type: String,
      enum: ["pieces", "units", "boxes", "cartons", "pallets", "containers"],
      default: "pieces",
    },
    weightUnit: {
      type: String,
      enum: ["kg", "g", "tons", "lbs", "oz"],
      default: "kg",
    },
    salesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Index for better performance
productSchema.index({ category: 1 })
productSchema.index({ isFeatured: 1 })
productSchema.index({ salesCount: -1 })

// Pre-save middleware to set primary image as imageUrl for backward compatibility
productSchema.pre("save", function (next) {
  if (this.images && this.images.length > 0) {
    const primaryImage = this.images.find((img) => img.isPrimary) || this.images[0]
    this.imageUrl = primaryImage.url
  }
  next()
})

// Transform output to match frontend expectations
productSchema.methods.toJSON = function () {
  const productObject = this.toObject()
  return {
    id: productObject._id,
    name: productObject.name,
    description: productObject.description,
    category: productObject.category,
    price: productObject.price,
    image_url: productObject.imageUrl,
    images: productObject.images || [],
    specifications: productObject.specifications,
    is_featured: productObject.isFeatured,
    moq_by_quantity: productObject.moqByQuantity,
    moq_by_weight: productObject.moqByWeight,
    min_quantity: productObject.minQuantity,
    min_weight: productObject.minWeight,
    quantity_unit: productObject.quantityUnit,
    weight_unit: productObject.weightUnit,
    sales_count: productObject.salesCount,
    created_at: productObject.createdAt,
    updated_at: productObject.updatedAt,
  }
}

module.exports = mongoose.model("Product", productSchema)
