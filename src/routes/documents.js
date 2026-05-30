// src/routes/documents.js

const express  = require("express");
const router   = express.Router();
const multer   = require("multer");
const { requireVisitor } = require("../middleware/visitor");
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  renameDocument,
  deleteDocument,
} = require("../controllers/documentController");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
});

// ── CREATE ─────────────────────────────────────────────────────────────────
router.post("/upload", requireVisitor, upload.array("images", 20), uploadDocument);

// ── READ ───────────────────────────────────────────────────────────────────
router.get("/",    requireVisitor, getDocuments);
router.get("/:id", requireVisitor, getDocumentById);

// ── UPDATE ─────────────────────────────────────────────────────────────────
router.patch("/:id/title", requireVisitor, renameDocument);

// ── DELETE ─────────────────────────────────────────────────────────────────
router.delete("/:id", requireVisitor, deleteDocument);

module.exports = router;