const ContactSubmission = require("../models/ContactSubmission");

const contactController = {
  // Submit contact form
  submitContact: async (req, res) => {
    try {
      const { name, email, phone, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ error: "Name, email, and message are required" });
      }

      const submission = new ContactSubmission({ name, email, phone, message });

      await submission.save();

      res.status(201).json({
        success: true,
        message: "Thank you for your message. We will get back to you soon!",
        submission,
      });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ error: "Failed to submit contact form" });
    }
  },

  // Get all contact submissions (optional: filter by status)
  getContacts: async (req, res) => {
    try {
      const { status } = req.query;
      const query = status ? { status } : {};
      const contacts = await ContactSubmission.find(query).sort({ createdAt: -1 });

      res.status(200).json({ success: true, contacts });
    } catch (error) {
      console.error("Failed to fetch contact submissions:", error);
      res.status(500).json({ error: "Failed to fetch contact submissions" });
    }
  },

  // Update contact submission (status and notes)
  updateContact: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      const updated = await ContactSubmission.findByIdAndUpdate(
        id,
        { status, notes },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ error: "Contact submission not found" });
      }

      res.status(200).json({ success: true, updated });
    } catch (error) {
      console.error("Failed to update contact submission:", error);
      res.status(500).json({ error: "Failed to update contact submission" });
    }
  },
};

module.exports = contactController;
