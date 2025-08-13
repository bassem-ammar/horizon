const mongoose = require("mongoose")
const dotenv = require("dotenv")
const AdminUser = require("../backend/models/AdminUser")
const Product = require("../backend/models/Product")
const ContactSubmission = require("../backend/models/ContactSubmission")
const QuoteRequest = require("../backend/models/QuoteRequest")

// Load environment variables
dotenv.config()

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb+srv://bassdmammar:53037912@horizon.sgt9i0k.mongodb.net/?retryWrites=true&w=majority&appName=horizon")
    console.log("✅ Connected to MongoDB")

    // Clear existing data
    await Promise.all([
      AdminUser.deleteMany({}),
      Product.deleteMany({}),
      ContactSubmission.deleteMany({}),
      QuoteRequest.deleteMany({}),
    ])
    console.log("🗑️ Cleared existing data")

    // Create admin user
    const adminUser = new AdminUser({
      username: "admin",
      email: "admin@horizonswtc.com",
      password: "admin123",
      name: "Admin User",
    })
    await adminUser.save()
    console.log("👤 Created admin user")

 
    // Create sample contact submissions
    const contacts = [
      {
        name: "John Smith",
        email: "john.smith@example.com",
        phone: "+1-555-0123",
        message: "Interested in your olive oil products. Please send me more information about bulk pricing.",
        status: "new",
      },
      {
        name: "Maria Garcia",
        email: "maria.garcia@tradeco.com",
        phone: "+1-555-0124",
        message: "We are looking for a reliable supplier of natural gas for our industrial operations.",
        status: "contacted",
      },
      {
        name: "Ahmed Hassan",
        email: "ahmed@energysolutions.com",
        phone: "+1-555-0125",
        message: "Please provide a quote for 1000 barrels of WTI crude oil.",
        status: "resolved",
      },
    ]

    await ContactSubmission.insertMany(contacts)
    console.log("📧 Created sample contact submissions")

  
    console.log("🎉 Database seeded successfully!")
    console.log("🔐 Admin Login: admin@horizonswtc.com / admin123")

    process.exit(0)
  } catch (error) {
    console.error("❌ Error seeding database:", error)
    process.exit(1)
  }
}

seedDatabase()
