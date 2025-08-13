const QuoteRequest = require("../models/QuoteRequest")

const quoteController = {
  // Submit multi-product quote request
  submitQuote: async (req, res) => {
    try {
      const { items, customer, language = "en" } = req.body

      // Validation
      if (!customer?.name || !customer?.email) {
        return res.status(400).json({
          success: false,
          error: "Customer name and email are required",
        })
      }

      if (!customer?.incoterm) {
        return res.status(400).json({
          success: false,
          error: "Incoterm is required",
        })
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          error: "At least one product item is required",
        })
      }

      // Validate each item
      for (const item of items) {
        if (!item.product_id || !item.product_name || !item.quantity || !item.unit_price) {
          return res.status(400).json({
            success: false,
            error: "Each item must have product_id, product_name, quantity, and unit_price",
          })
        }

        if (item.quantity <= 0 || item.unit_price < 0) {
          return res.status(400).json({
            success: false,
            error: "Invalid quantity or unit price",
          })
        }

        // Calculate subtotal if not provided
        if (!item.subtotal) {
          item.subtotal = item.quantity * item.unit_price
        }
      }

      // Calculate total price
      const total_price = items.reduce((sum, item) => sum + item.subtotal, 0)

      // Create quote request (quote number will be auto-generated)
      const quote = new QuoteRequest({
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          company: customer.company,
          address: customer.address,
          urgency: customer.urgency,
          incoterm: customer.incoterm,
          message: customer.message,
        },
        items: items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
        })),
        total_price,
        language,
      })

      console.log("Creating quote for customer:", customer.name)

      await quote.save()

      res.status(201).json({
        success: true,
        message: "Quote request submitted successfully. We will contact you within 24 hours!",
        quote_id: quote.id,
        quote_number: quote.quote_number,
        quote_sequence: quote.quote_sequence,
        quote_year: quote.quote_year,
        total_items: quote.total_items,
        total_price: quote.total_price,
      })
    } catch (error) {
      console.error("Quote request error:", error)
      res.status(500).json({
        success: false,
        error: "Failed to submit quote request",
      })
    }
  },

  // Get all quote requests (admin)
  getAllQuotes: async (req, res) => {
    try {
      const { page = 1, limit = 10, status, customer_email, year, sort = "-createdAt" } = req.query

      const filter = {}
      if (status) filter.status = status
      if (customer_email) filter["customer.email"] = new RegExp(customer_email, "i")
      if (year) filter.quote_year = Number.parseInt(year)

      const quotes = await QuoteRequest.find(filter)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec()

      const total = await QuoteRequest.countDocuments(filter)

      res.json({
        success: true,
        quotes,
        pagination: {
          current_page: Number.parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_quotes: total,
          per_page: Number.parseInt(limit),
        },
      })
    } catch (error) {
      console.error("Get quotes error:", error)
      res.status(500).json({
        success: false,
        error: "Failed to fetch quotes",
      })
    }
  },

  // Get single quote by ID
  getQuoteById: async (req, res) => {
    try {
      const { id } = req.params
      const quote = await QuoteRequest.findById(id)

      if (!quote) {
        return res.status(404).json({
          success: false,
          error: "Quote not found",
        })
      }

      res.json({
        success: true,
        quote,
      })
    } catch (error) {
      console.error("Get quote error:", error)
      res.status(500).json({
        success: false,
        error: "Failed to fetch quote",
      })
    }
  },

  // Get quote by quote number (for customer tracking)
  getQuoteByNumber: async (req, res) => {
    try {
      const { quote_number } = req.params
      const quote = await QuoteRequest.findOne({ quote_number })

      if (!quote) {
        return res.status(404).json({
          success: false,
          error: "Quote not found",
        })
      }

      res.json({
        success: true,
        quote,
      })
    } catch (error) {
      console.error("Get quote by number error:", error)
      res.status(500).json({
        success: false,
        error: "Failed to fetch quote",
      })
    }
  },

  // Update quote status and pricing (admin) - Updated to use tax_percentage
  updateQuote: async (req, res) => {
    try {
      const { id } = req.params
      const { status, quoted_price, tax_percentage, will_ship, shipping_price, notes } = req.body

      console.log("Update quote request body:", req.body)

      const quote = await QuoteRequest.findById(id)
      if (!quote) {
        return res.status(404).json({
          success: false,
          error: "Quote not found",
        })
      }

      // Update fields
      if (status !== undefined) quote.status = status
      if (quoted_price !== undefined) quote.quoted_price = quoted_price
      if (tax_percentage !== undefined) quote.tax_percentage = tax_percentage
      if (will_ship !== undefined) quote.will_ship = will_ship
      if (shipping_price !== undefined) quote.shipping_price = shipping_price
      if (notes !== undefined) quote.notes = notes

      await quote.save()

      // TODO: Send status update email to customer
      // if (status) await sendStatusUpdateEmail(quote)

      res.json({
        success: true,
        message: "Quote updated successfully",
        quote,
      })
    } catch (error) {
      console.error("Update quote error:", error)
      res.status(500).json({
        success: false,
        error: "Failed to update quote",
      })
    }
  },

  // Get customer's quotes
  getCustomerQuotes: async (req, res) => {
    try {
      const { email } = req.params
      const quotes = await QuoteRequest.findByCustomerEmail(email)

      res.json({
        success: true,
        quotes,
        total: quotes.length,
      })
    } catch (error) {
      console.error("Get customer quotes error:", error)
      res.status(500).json({
        success: false,
        error: "Failed to fetch customer quotes",
      })
    }
  },

  // Get quote statistics (admin dashboard)
  getQuoteStats: async (req, res) => {
    try {
      const currentYear = new Date().getFullYear()
      const { year = currentYear } = req.query

      const stats = await QuoteRequest.aggregate([
        { $match: { quote_year: Number.parseInt(year) } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            total_value: { $sum: "$final_price" },
          },
        },
      ])

      const totalQuotes = await QuoteRequest.countDocuments({ quote_year: Number.parseInt(year) })
      const activeQuotes = await QuoteRequest.countDocuments({
        quote_year: Number.parseInt(year),
        expires_at: { $gt: new Date() },
        status: { $in: ["pending", "processing", "quoted"] },
      })

      const shippingStats = await QuoteRequest.aggregate([
        { $match: { quote_year: Number.parseInt(year) } },
        {
          $group: {
            _id: "$will_ship",
            count: { $sum: 1 },
            total_shipping: { $sum: "$shipping_price" },
          },
        },
      ])

      // Get yearly summary
      const yearlySummary = await QuoteRequest.aggregate([
        {
          $group: {
            _id: "$quote_year",
            total_quotes: { $sum: 1 },
            total_value: { $sum: "$final_price" },
          },
        },
        { $sort: { _id: -1 } },
        { $limit: 5 },
      ])

      res.json({
        success: true,
        stats: {
          by_status: stats,
          total_quotes: totalQuotes,
          active_quotes: activeQuotes,
          shipping_stats: shippingStats,
          yearly_summary: yearlySummary,
          current_year: Number.parseInt(year),
        },
      })
    } catch (error) {
      console.error("Get quote stats error:", error)
      res.status(500).json({
        success: false,
        error: "Failed to fetch quote statistics",
      })
    }
  },

  // Get next quote number preview (for admin reference)
  getNextQuoteNumber: async (req, res) => {
    try {
      const quoteData = await QuoteRequest.generateQuoteNumber()

      res.json({
        success: true,
        next_quote_number: quoteData.quote_number,
        sequence: quoteData.quote_sequence,
        year: quoteData.quote_year,
      })
    } catch (error) {
      console.error("Get next quote number error:", error)
      res.status(500).json({
        success: false,
        error: "Failed to generate next quote number",
      })
    }
  },

  // Delete quote (admin)
  deleteQuote: async (req, res) => {
    try {
      const { id } = req.params
      const quote = await QuoteRequest.findByIdAndDelete(id)

      if (!quote) {
        return res.status(404).json({
          success: false,
          error: "Quote not found",
        })
      }

      res.json({
        success: true,
        message: "Quote deleted successfully",
      })
    } catch (error) {
      console.error("Delete quote error:", error)
      res.status(500).json({
        success: false,
        error: "Failed to delete quote",
      })
    }
  },
}

module.exports = quoteController
