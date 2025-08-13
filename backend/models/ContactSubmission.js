const mongoose = require("mongoose")

const contactSubmissionSchema = new mongoose.Schema(
  {
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
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "resolved"],
      default: "new",
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

// Index for better performance
contactSubmissionSchema.index({ status: 1 })
contactSubmissionSchema.index({ createdAt: -1 })

// Transform output to match frontend expectations
contactSubmissionSchema.methods.toJSON = function () {
  const contactObject = this.toObject()
  return {
    id: contactObject._id,
    name: contactObject.name,
    email: contactObject.email,
    phone: contactObject.phone,
    message: contactObject.message,
    status: contactObject.status,
    notes: contactObject.notes,
    created_at: contactObject.createdAt,
    updated_at: contactObject.updatedAt,
  }
}

module.exports = mongoose.model("ContactSubmission", contactSubmissionSchema)
