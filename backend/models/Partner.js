const mongoose = require("mongoose")

const partnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Partner name is required"],
      trim: true,
      maxlength: [100, "Partner name cannot exceed 100 characters"],
    },
    logo: {
      type: String,
      required: [true, "Partner logo is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      maxlength: [500, "Description cannot exceed 500 characters"],
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => {
          if (!v) return true // Allow empty string
          return /^https?:\/\/.+/.test(v)
        },
        message: "Website must be a valid URL",
      },
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Index for better query performance
partnerSchema.index({ isActive: 1, sortOrder: 1, createdAt: -1 })

// Virtual for full logo URL
partnerSchema.virtual("logoUrl").get(function () {
  if (this.logo && this.logo.startsWith("http")) {
    return this.logo
  }
  return `${process.env.BASE_URL || ""}${this.logo}`
})

// Static method to get active partners
partnerSchema.statics.getActivePartners = function () {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: -1 })
    .select("name logo logoUrl description website")
}

// Instance method to toggle active status
partnerSchema.methods.toggleActive = function () {
  this.isActive = !this.isActive
  return this.save()
}

module.exports = mongoose.model("Partner", partnerSchema)
