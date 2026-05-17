const express  = require("express");
const router   = express.Router();
const cloudinary = require("cloudinary").v2;
const multer   = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const Document = require("../models/Document");
const Visitor  = require("../models/Visitor");
const { requireVisitor } = require("../middleware/visitor");

// ── Cloudinary multer storage ──────────────────────────────────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         "document-master",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  },
});
const upload = multer({ storage });

// ── POST /api/documents/upload ─────────────────────────────────────────────
// Upload one or multiple images, create a document
router.post(
  "/upload",
  requireVisitor,
  upload.array("images", 20), // max 20 pages
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: "No images uploaded" });
      }

      const { title, mode, filters } = req.body;
      // filters is a JSON array like ["original","bw","lighten"]
      const filterArr = filters ? JSON.parse(filters) : [];

      const pages = req.files.map((file, i) => ({
        imageUrl:   file.path,
        publicId:   file.filename,
        filter:     filterArr[i] || "original",
        pageNumber: i + 1,
      }));

      const document = await Document.create({
        visitorId:  req.visitor.visitorId,
        title:      title || `ScanOn_${Date.now()}`,
        pages,
        totalPages: pages.length,
        mode:       mode || (pages.length > 1 ? "batch" : "single"),
      });

      // Increment visitor scan count
      await Visitor.findOneAndUpdate(
        { visitorId: req.visitor.visitorId },
        { $inc: { totalScans: 1 } }
      );

      res.status(201).json({ success: true, document });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── GET /api/documents ─────────────────────────────────────────────────────
// Get all documents for a visitor
router.get("/", requireVisitor, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const documents = await Document.find({ visitorId: req.visitor.visitorId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Document.countDocuments({
      visitorId: req.visitor.visitorId,
    });

    res.json({ success: true, documents, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/documents/:id ─────────────────────────────────────────────────
router.get("/:id", requireVisitor, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id:       req.params.id,
      visitorId: req.visitor.visitorId,
    });
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    res.json({ success: true, document });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/documents/:id ──────────────────────────────────────────────
router.delete("/:id", requireVisitor, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id:       req.params.id,
      visitorId: req.visitor.visitorId,
    });
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // Delete images from Cloudinary
    await Promise.all(
      document.pages.map((page) =>
        cloudinary.uploader.destroy(page.publicId)
      )
    );

    await document.deleteOne();
    res.json({ success: true, message: "Document deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/documents/:id/title ────────────────────────────────────────
router.patch("/:id/title", requireVisitor, async (req, res) => {
  try {
    const { title } = req.body;
    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, visitorId: req.visitor.visitorId },
      { title },
      { new: true }
    );
    if (!document) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }
    res.json({ success: true, document });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;