const express = require("express");
const router = express.Router();
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

// ── CREATE / VERIFY ────────────────────────────────────────────────────────
// GET /api/visitor?visitor_id=... (Handles both first-time & returning users)
router.get("/", getOrCreateVisitor);

// Get current visitor profile (subsequent app launches with middleware)
router.get("/profile", requireVisitor, getOrCreateVisitor);

// Get all visitors (admin/testing)
router.get("/all", getAllVisitors);

// Get specific visitor by visitorId (admin/testing)
router.get("/:visitorId", getVisitorById);

// ── UPDATE ─────────────────────────────────────────────────────────────────
router.patch("/profile", requireVisitor, updateVisitor);
router.patch("/profile/deactivate", requireVisitor, deactivateVisitor);

// ── DELETE ─────────────────────────────────────────────────────────────────
router.delete("/profile", requireVisitor, deleteVisitor);
router.delete("/:visitorId", deleteVisitorById);

module.exports = router;