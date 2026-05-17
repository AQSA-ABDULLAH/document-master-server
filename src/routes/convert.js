const express    = require("express");
const router     = express.Router();
const cloudinary = require("cloudinary").v2;
const Document   = require("../models/Document");
const { requireVisitor } = require("../middleware/visitor");
const https      = require("https");
const fs         = require("fs");
const path       = require("path");
const os         = require("os");

// Helper: download image from URL to temp file
const downloadImage = (url, dest) =>
  new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      res.pipe(file);
      file.on("finish", () => { file.close(); resolve(dest); });
    }).on("error", reject);
  });

// ── POST /api/convert/:documentId/pdf ─────────────────────────────────────
// Convert document pages to a PDF (uploaded to Cloudinary)
router.post("/:documentId/pdf", requireVisitor, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id:       req.params.documentId,
      visitorId: req.visitor.visitorId,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // Already converted
    if (document.pdfFileUrl) {
      return res.json({ success: true, url: document.pdfFileUrl, cached: true });
    }

    // Use Cloudinary's built-in PDF generation from images
    const imagePublicIds = document.pages.map((p) => p.publicId);

    // Create PDF using Cloudinary's multi method
    const pdfResult = await cloudinary.uploader.multi(
      imagePublicIds[0], // base public_id
      {
        transformation: imagePublicIds.map((id) => ({ overlay: id })),
        format: "pdf",
        public_id: `pdfs/${document._id}`,
      }
    );

    document.pdfFileUrl = pdfResult.secure_url;
    await document.save();

    res.json({ success: true, url: pdfResult.secure_url, cached: false });
  } catch (err) {
    console.error("PDF conversion error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/convert/:documentId/word ────────────────────────────────────
// Convert OCR text to a Word-like plain text file
router.post("/:documentId/word", requireVisitor, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id:       req.params.documentId,
      visitorId: req.visitor.visitorId,
    });

    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (document.wordFileUrl) {
      return res.json({ success: true, url: document.wordFileUrl, cached: true });
    }

    // Collect OCR text from all pages
    const allText = document.pages
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map((p, i) => `--- Page ${i + 1} ---\n\n${p.ocrText || "[No text extracted]"}`)
      .join("\n\n");

    // Save as .txt to temp
    const tmpPath = path.join(os.tmpdir(), `${document._id}.txt`);
    fs.writeFileSync(tmpPath, allText, "utf8");

    // Upload txt to Cloudinary as raw file
    const uploadResult = await cloudinary.uploader.upload(tmpPath, {
      resource_type: "raw",
      public_id:     `words/${document._id}`,
      format:        "txt",
    });

    // Clean up temp file
    fs.unlinkSync(tmpPath);

    document.wordFileUrl = uploadResult.secure_url;
    await document.save();

    res.json({ success: true, url: uploadResult.secure_url, cached: false });
  } catch (err) {
    console.error("Word conversion error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;