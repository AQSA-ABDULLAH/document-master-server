const Visitor = require("../models/Visitor");

// ── CREATE / GET — Auto register or return existing ────────────────────────
// GET /api/visitor/me
const getOrCreateVisitor = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      isNew: req.isNewVisitor || false,
      visitor: req.visitor,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── READ — Get all visitors ────────────────────────────────────────────────
// GET /api/visitor/all
const getAllVisitors = async (req, res) => {
  try {
    const {
      page     = 1,
      limit    = 10,
      platform,
      isActive,
      sortBy   = "createdAt",
      order    = "desc",
    } = req.query;

    // Build filter
    const filter = {};
    if (platform) filter["deviceInfo.platform"] = platform;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const visitors = await Visitor.find(filter)
      .sort({ [sortBy]: order === "desc" ? -1 : 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Visitor.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / limit),
      count:      visitors.length,
      visitors,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── READ — Get single visitor by visitorId ─────────────────────────────────
// GET /api/visitor/:visitorId
const getVisitorById = async (req, res) => {
  try {
    const visitor = await Visitor.findOne({
      visitorId: req.params.visitorId,
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    res.status(200).json({ success: true, visitor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE — Update current visitor's device info ──────────────────────────
// PATCH /api/visitor/me
const updateVisitor = async (req, res) => {
  try {
    const allowedFields = ["deviceInfo"];
    const updates = {};

    // Only allow updating specific fields
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields to update. Allowed: deviceInfo",
      });
    }

    const visitor = await Visitor.findOneAndUpdate(
      { visitorId: req.visitor.visitorId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Visitor updated successfully",
      visitor,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE — Deactivate visitor (soft delete) ──────────────────────────────
// PATCH /api/visitor/me/deactivate
const deactivateVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findOneAndUpdate(
      { visitorId: req.visitor.visitorId },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Visitor deactivated",
      visitor,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE — Hard delete current visitor ───────────────────────────────────
// DELETE /api/visitor/me
const deleteVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findOneAndDelete({
      visitorId: req.visitor.visitorId,
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Visitor permanently deleted",
      deletedVisitorId: visitor.visitorId,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE — Hard delete by visitorId (admin) ──────────────────────────────
// DELETE /api/visitor/:visitorId
const deleteVisitorById = async (req, res) => {
  try {
    const visitor = await Visitor.findOneAndDelete({
      visitorId: req.params.visitorId,
    });

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Visitor permanently deleted",
      deletedVisitorId: visitor.visitorId,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getOrCreateVisitor,
  getAllVisitors,
  getVisitorById,
  updateVisitor,
  deactivateVisitor,
  deleteVisitor,
  deleteVisitorById,
};