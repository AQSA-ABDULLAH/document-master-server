const express = require("express");
const router  = express.Router();
const {
  getOrCreateVisitor,
  getAllVisitors,
  getVisitorById,
  updateVisitor,
  deactivateVisitor,
  deleteVisitor,
  deleteVisitorById,
} = require("../controllers/visitorController");
const { requireVisitor } = require("../middleware/visitor");

// ── CREATE ─────────────────────────────────────────────────────────────────
// First app launch — no visitorId in AsyncStorage
// Generate UUID on device → send here → stored in DB
router.post("/register", requireVisitor, getOrCreateVisitor);

// ── READ ───────────────────────────────────────────────────────────────────
// Get current visitor profile (subsequent app launches)
router.get("/profile", requireVisitor, getOrCreateVisitor);

// Get all visitors (admin/testing)
router.get("/all", getAllVisitors);

// Get specific visitor by visitorId (admin/testing)
router.get("/:visitorId", getVisitorById);

// ── UPDATE ─────────────────────────────────────────────────────────────────
// Update current visitor device info
router.patch("/profile", requireVisitor, updateVisitor);

// Soft delete — deactivate visitor
router.patch("/profile/deactivate", requireVisitor, deactivateVisitor);

// ── DELETE ─────────────────────────────────────────────────────────────────
// Hard delete current visitor
router.delete("/profile", requireVisitor, deleteVisitor);

// Hard delete by visitorId (admin)
router.delete("/:visitorId", deleteVisitorById);

module.exports = router;