// api/index.js

require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const cloudinary = require("cloudinary").v2;
const connectDB  = require("../src/config/db");
const { visitorMiddleware } = require("../src/middleware/visitor");

// ── Routes ─────────────────────────────────────────────────────────────────
const visitorRouter   = require("../src/routes/visitor");
const documentsRouter = require("../src/routes/documents");
const ocrRouter       = require("../src/routes/ocr");
const convertRouter   = require("../src/routes/convert");

// ── Cloudinary config ──────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const app = express();

// ── Global Middleware ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ── Connect DB once on startup ─────────────────────────────────────────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    res.status(500).json({ success: false, message: "Database connection failed" });
  }
});

// ── Visitor middleware (runs on all routes) ────────────────────────────────
app.use(visitorMiddleware);

// ── Health check ───────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Document Master API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────
app.use("/api/visitor",   visitorRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/ocr",       ocrRouter);
app.use("/api/convert",   convertRouter);

// ── 404 Handler ───────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// ── Start Server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("─────────────────────────────────────────");
  console.log(`✅  Server running on http://localhost:${PORT}`);
  console.log(`📋  Health:    http://localhost:${PORT}/api/health`);
  console.log(`👤  Visitor:   http://localhost:${PORT}/api/visitor/me`);
  console.log(`📄  Documents: http://localhost:${PORT}/api/documents`);
  console.log(`🔍  OCR:       http://localhost:${PORT}/api/ocr`);
  console.log(`🔄  Convert:   http://localhost:${PORT}/api/convert`);
  console.log("─────────────────────────────────────────");
});

module.exports = app;