const express = require("express")
const multer = require("multer")
const path = require("path")
const {
  getActivePartners,
  getAllPartners,
  getPartner,
  createPartner,
  updatePartner,
  deletePartner,
  togglePartnerStatus,
} = require("../controllers/partnerController")


const router = express.Router()

// Multer configuration for partner logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    cb(null, "partner-" + uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith("image/")) {
      cb(null, true)
    } else {
      cb(new Error("Only image files are allowed!"), false)
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
})

// Public routes
router.get("/", getActivePartners)
router.delete("/", deletePartner)

// Protected admin routes

router.route("/").get(getAllPartners).post(upload.single("logo"), createPartner)

router.route("/:id").get(getPartner).put(upload.single("logo"), updatePartner).delete(deletePartner)

router.patch("/admin/:id/toggle", togglePartnerStatus)

module.exports = router
