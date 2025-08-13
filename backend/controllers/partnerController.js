const Partner = require("../models/Partner")
const fs = require("fs")
const path = require("path")

// @desc    Get all active partners (public)
// @route   GET /api/partners
// @access  Public
const getActivePartners = async (req, res) => {
  try {
    const partners = await Partner.getActivePartners()

    res.status(200).json({
      success: true,
      count: partners.length,
      partners,
    })
  } catch (error) {
    console.error("Error fetching active partners:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch partners",
    })
  }
}

// @desc    Get all partners (admin)
// @route   GET /api/admin/partners
// @access  Private
const getAllPartners = async (req, res) => {
  try {
    const page = Number.parseInt(req.query.page) || 1
    const limit = Number.parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const query = {}

    // Filter by status if provided
    if (req.query.status) {
      query.isActive = req.query.status === "active"
    }

    // Search by name if provided
    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: "i" }
    }

    const partners = await Partner.find(query).sort({ sortOrder: 1, createdAt: -1 }).skip(skip).limit(limit)

    const total = await Partner.countDocuments(query)

    res.status(200).json({
      success: true,
      count: partners.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      partners,
    })
  } catch (error) {
    console.error("Error fetching all partners:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch partners",
    })
  }
}

// @desc    Get single partner
// @route   GET /api/admin/partners/:id
// @access  Private
const getPartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id)

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: "Partner not found",
      })
    }

    res.status(200).json({
      success: true,
      partner,
    })
  } catch (error) {
    console.error("Error fetching partner:", error)
    res.status(500).json({
      success: false,
      error: "Failed to fetch partner",
    })
  }
}

// @desc    Create new partner
// @route   POST /api/admin/partners
// @access  Private
const createPartner = async (req, res) => {
  try {
    const { name, description, website, isActive, sortOrder } = req.body

    if (!name || !req.file) {
      return res.status(400).json({
        success: false,
        error: "Name and logo are required",
      })
    }

    const partnerData = {
      name,
      logo: `/uploads/${req.file.filename}`,
      isActive: isActive === "true" || isActive === true,
    }

    if (description) partnerData.description = description
    if (website) partnerData.website = website
    if (sortOrder) partnerData.sortOrder = Number.parseInt(sortOrder)

    const partner = await Partner.create(partnerData)

    res.status(201).json({
      success: true,
      message: "Partner created successfully",
      partner,
    })
  } catch (error) {
    console.error("Error creating partner:", error)

    // Delete uploaded file if partner creation fails
    if (req.file) {
      const filePath = path.join(__dirname, "..", "uploads", req.file.filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      })
    }

    res.status(500).json({
      success: false,
      error: "Failed to create partner",
    })
  }
}

// @desc    Update partner
// @route   PUT /api/admin/partners/:id
// @access  Private
const updatePartner = async (req, res) => {
  try {
    const { name, description, website, isActive, sortOrder } = req.body

    const partner = await Partner.findById(req.params.id)
    if (!partner) {
      return res.status(404).json({
        success: false,
        error: "Partner not found",
      })
    }

    // Store old logo path for potential deletion
    const oldLogoPath = partner.logo

    // Update fields
    if (name) partner.name = name
    if (description !== undefined) partner.description = description
    if (website !== undefined) partner.website = website
    if (isActive !== undefined) partner.isActive = isActive === "true" || isActive === true
    if (sortOrder !== undefined) partner.sortOrder = Number.parseInt(sortOrder)

    // Update logo if new file is uploaded
    if (req.file) {
      partner.logo = `/uploads/${req.file.filename}`

      // Delete old logo file
      if (oldLogoPath && !oldLogoPath.startsWith("http")) {
        const oldFilePath = path.join(__dirname, "..", oldLogoPath)
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath)
        }
      }
    }

    await partner.save()

    res.status(200).json({
      success: true,
      message: "Partner updated successfully",
      partner,
    })
  } catch (error) {
    console.error("Error updating partner:", error)

    // Delete uploaded file if update fails
    if (req.file) {
      const filePath = path.join(__dirname, "..", "uploads", req.file.filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message)
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      })
    }

    res.status(500).json({
      success: false,
      error: "Failed to update partner",
    })
  }
}

// @desc    Delete partner
// @route   DELETE /api/admin/partners/:id
// @access  Private
const deletePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id)

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: "Partner not found",
      })
    }

    // Delete logo file
    if (partner.logo && !partner.logo.startsWith("http")) {
      const logoPath = path.join(__dirname, "..", partner.logo)
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath)
      }
    }

    await Partner.findByIdAndDelete(req.params.id)

    res.status(200).json({
      success: true,
      message: "Partner deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting partner:", error)
    res.status(500).json({
      success: false,
      error: "Failed to delete partner",
    })
  }
}

// @desc    Toggle partner active status
// @route   PATCH /api/admin/partners/:id/toggle
// @access  Private
const togglePartnerStatus = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id)

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: "Partner not found",
      })
    }

    await partner.toggleActive()

    res.status(200).json({
      success: true,
      message: `Partner ${partner.isActive ? "activated" : "deactivated"} successfully`,
      partner,
    })
  } catch (error) {
    console.error("Error toggling partner status:", error)
    res.status(500).json({
      success: false,
      error: "Failed to toggle partner status",
    })
  }
}

module.exports = {
  getActivePartners,
  getAllPartners,
  getPartner,
  createPartner,
  updatePartner,
  deletePartner,
  togglePartnerStatus,
}
