const mongoose = require("mongoose")

// Schema for individual quote items
const quoteItemSchema = new mongoose.Schema({
  product_id: {
    type: String,
    required: true,
  },
  product_name: {
    type: String,
    required: true,
    trim: true,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unit_price: {
    type: Number,
    required: true,
    min: 0,
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
})

const quoteRequestSchema = new mongoose.Schema(
  {
    // Customer information
    customer: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
      },
      phone: {
        type: String,
        trim: true,
      },
      company: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      incoterm: {
        type: String,
        required: true,
      },
      urgency: {
        type: String,
        enum: ["standard", "urgent", "immediate"],
      },
      message: {
        type: String,
        trim: true,
      },
    },

    // Quote items (multiple products)
    items: [quoteItemSchema],

    // Total pricing
    total_price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Quote metadata
    language: {
      type: String,
      enum: ["en", "fr"],
      default: "en",
    },

    status: {
      type: String,
      enum: ["pending", "processing", "quoted", "completed", "cancelled"],
      default: "pending",
    },

    // Admin fields
    quoted_price: {
      type: Number,
    },

    // Changed from discount_percentage to tax_percentage
    tax_percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },

    // Shipping fields
    will_ship: {
      type: Boolean,
      default: false,
    },

    shipping_price: {
      type: Number,
      min: 0,
      default: 0,
    },

    final_price: {
      type: Number,
    },

    notes: {
      type: String,
    },

    // Quote reference number
    quote_number: {
      type: String,
      unique: true,
    },

    // Quote sequence number for the year
    quote_sequence: {
      type: Number,
      default: 1,
    },

    // Quote year for tracking yearly sequences
    quote_year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },

    // Expiration date
    expires_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
)

// Create a separate collection to track quote counters by year
const quoteCounterSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true,
  },
  counter: {
    type: Number,
    required: true,
    default: 0,
  },
})

const QuoteCounter = mongoose.model("QuoteCounter", quoteCounterSchema)

// Static method to generate next quote number
quoteRequestSchema.statics.generateQuoteNumber = async () => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const day = String(now.getDate()).padStart(2, "0")
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const yearShort = String(currentYear).slice(-2) // Last 2 digits of year

  // Find or create counter for current year
  let counter = await QuoteCounter.findOne({ year: currentYear })

  if (!counter) {
    // Create new counter for the year
    counter = new QuoteCounter({ year: currentYear, counter: 1 })
  } else {
    // Increment existing counter
    counter.counter += 1
  }

  await counter.save()

  // Format: QT-DD/MM/YY-XXX (where XXX is zero-padded sequence)
  const sequence = String(counter.counter).padStart(3, "0")
  const quoteNumber = `QT-${day}/${month}/${yearShort}-${sequence}`

  return {
    quote_number: quoteNumber,
    quote_sequence: counter.counter,
    quote_year: currentYear,
  }
}

// Generate quote number before saving
quoteRequestSchema.pre("save", async function (next) {
  if (!this.quote_number) {
    try {
      const quoteData = await this.constructor.generateQuoteNumber()
      this.quote_number = quoteData.quote_number
      this.quote_sequence = quoteData.quote_sequence
      this.quote_year = quoteData.quote_year
    } catch (error) {
      console.error("Error generating quote number:", error)
      return next(error)
    }
  }

  // Set expiration date (30 days from creation)
  if (!this.expires_at) {
    this.expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  }

  // Calculate final price with shipping logic
  this.calculateFinalPrice()

  next()
})

// Method to calculate final price with tax (not discount)
quoteRequestSchema.methods.calculateFinalPrice = function () {
  // Start with products subtotal
  const productsSubtotal = this.items.reduce((sum, item) => sum + item.subtotal, 0)

  // Use quoted price if set, otherwise use products subtotal
  const basePrice = this.quoted_price || productsSubtotal

  // Calculate tax only on the base price (products), not shipping
  let taxAmount = 0
  if (this.tax_percentage && this.tax_percentage > 0) {
    taxAmount = basePrice * (this.tax_percentage / 100)
  }

  // Add shipping separately (no tax on shipping)
  const shippingCost = this.will_ship ? this.shipping_price || 0 : 0

  // Final price = base price + taxAmount + shippingCost
  const finalAmount = basePrice + taxAmount + shippingCost

  this.final_price = Math.round(finalAmount * 100) / 100 // Round to 2 decimal places

  return this.final_price
}

// Indexes for better performance
quoteRequestSchema.index({ status: 1 })
quoteRequestSchema.index({ createdAt: -1 })
quoteRequestSchema.index({ "customer.email": 1 })
quoteRequestSchema.index({ quote_number: 1 })
quoteRequestSchema.index({ expires_at: 1 })
quoteRequestSchema.index({ quote_year: 1, quote_sequence: 1 })

// Virtual for total items count
quoteRequestSchema.virtual("total_items").get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0)
})

// Virtual for products subtotal
quoteRequestSchema.virtual("products_subtotal").get(function () {
  return this.items.reduce((sum, item) => sum + item.subtotal, 0)
})

// Transform output to match frontend expectations
quoteRequestSchema.methods.toJSON = function () {
  const quoteObject = this.toObject({ virtuals: true })
  return {
    id: quoteObject._id,
    quote_number: quoteObject.quote_number,
    quote_sequence: quoteObject.quote_sequence,
    quote_year: quoteObject.quote_year,
    customer: quoteObject.customer,
    items: quoteObject.items,
    total_price: quoteObject.total_price,
    products_subtotal: quoteObject.products_subtotal,
    total_items: quoteObject.total_items,
    language: quoteObject.language,
    status: quoteObject.status,
    quoted_price: quoteObject.quoted_price,
    tax_percentage: quoteObject.tax_percentage,
    will_ship: quoteObject.will_ship,
    shipping_price: quoteObject.shipping_price,
    final_price: quoteObject.final_price,
    incoterm: quoteObject.customer?.incoterm,
    notes: quoteObject.notes,
    expires_at: quoteObject.expires_at,
    created_at: quoteObject.createdAt,
    updated_at: quoteObject.updatedAt,
  }
}

// Static method to find quotes by customer email
quoteRequestSchema.statics.findByCustomerEmail = function (email) {
  return this.find({ "customer.email": email }).sort({ createdAt: -1 })
}

// Static method to find active quotes (not expired)
quoteRequestSchema.statics.findActive = function () {
  return this.find({
    expires_at: { $gt: new Date() },
    status: { $in: ["pending", "processing", "quoted"] },
  })
}

// Static method to get quote statistics by year
quoteRequestSchema.statics.getYearlyStats = function (year) {
  return this.aggregate([
    { $match: { quote_year: year } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        total_value: { $sum: "$final_price" },
      },
    },
  ])
}

module.exports = mongoose.model("QuoteRequest", quoteRequestSchema)
