const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");

// POST new contact
router.post("/", contactController.submitContact);

// GET all contacts (optional filter by ?status=new)
router.get("/", contactController.getContacts);

// PUT update contact by ID
router.put("/:id", contactController.updateContact);

module.exports = router;
