const Visitor = require("../models/Visitor");

// ── Attach visitor to req — auto-create if new ─────────────────────────────
const visitorMiddleware = async (req, res, next) => {
  const visitorId = req.headers["x-visitor-id"];

  if (!visitorId) {
    req.visitor = null;
    return next();
  }

  try {
    let visitor = await Visitor.findOne({ visitorId });
    let isNew = false;

    if (!visitor) {
      // Auto-register new visitor
      visitor = await Visitor.create({
        visitorId,
        deviceInfo: {
          platform:    req.headers["x-platform"]     || "unknown",
          version:     req.headers["x-app-version"]  || "unknown",
          deviceModel: req.headers["x-device-model"] || "unknown",
        },
      });
      isNew = true;
      console.log(`🆕 New visitor registered: ${visitorId}`);
    } else {
      // Update last active timestamp
      visitor.lastActiveAt = new Date();
      await visitor.save();
    }

    req.visitor    = visitor;
    req.isNewVisitor = isNew;
    next();
  } catch (err) {
    console.error("❌ Visitor middleware error:", err.message);
    next(); // don't block the request
  }
};

// ── Guard — blocks route if no visitor id sent ─────────────────────────────
const requireVisitor = (req, res, next) => {
  if (!req.visitor) {
    return res.status(400).json({
      success: false,
      message: "x-visitor-id header is required",
    });
  }
  next();
};

module.exports = { visitorMiddleware, requireVisitor };