const express    = require("express");
const router     = express.Router();
const Tesseract  = require("tesseract.js");
const Document   = require("../models/Document");
const { requireVisitor } = require("../middleware/visitor");

// ── POST /api/ocr/:documentId/page/:pageNumber ────────────────────────────
// Extract text from a specific page
router.post("/:documentId/page/:pageNumber", requireVisitor, async (req, res) => {
  try {
    const { documentId, pageNumber } = req.params;

    const document = await Document.findOne({
      _id:       documentId,
      visitorId: req.visitor.visitorId,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const page = document.pages.find(
      (p) => p.pageNumber === Number(pageNumber)
    );

    if (!page) {
      return res.status(404).json({ success: false, message: "Page not found" });
    }

    // Already extracted — return cached
    if (page.ocrText) {
      return res.json({ success: true, text: page.ocrText, cached: true });
    }

    // Run Tesseract OCR on the Cloudinary image URL
    const { data: { text } } = await Tesseract.recognize(page.imageUrl, "eng", {
      logger: (m) => console.log(m),
    });

    // Save extracted text to DB
    page.ocrText = text.trim();
    await document.save();

    res.json({ success: true, text: text.trim(), cached: false });
  } catch (err) {
    console.error("OCR error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/ocr/:documentId/all ─────────────────────────────────────────
// Extract text from ALL pages of a document
router.post("/:documentId/all", requireVisitor, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id:       req.params.documentId,
      visitorId: req.visitor.visitorId,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const results = await Promise.all(
      document.pages.map(async (page) => {
        if (page.ocrText) return { pageNumber: page.pageNumber, text: page.ocrText };

        const { data: { text } } = await Tesseract.recognize(page.imageUrl, "eng");
        page.ocrText = text.trim();
        return { pageNumber: page.pageNumber, text: text.trim() };
      })
    );

    await document.save();

    res.json({ success: true, results });
  } catch (err) {
    console.error("OCR all error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;