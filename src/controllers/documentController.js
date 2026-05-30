// src/controllers/documentController.js

const Document = require("../models/Document");
const Visitor  = require("../models/Visitor");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

// ── Helper: upload buffer to Cloudinary ───────────────────────────────────
const uploadToCloudinary = (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "document-master",
        public_id: `${Date.now()}_${filename}`,
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
};

// ── CREATE: Upload images & save document ─────────────────────────────────
// POST /api/documents/upload
const uploadDocument = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    const { title, mode, filters } = req.body;
    const filterArr = filters ? JSON.parse(filters) : [];

    // Upload all files to Cloudinary
    const uploadResults = await Promise.all(
      req.files.map((file) =>
        uploadToCloudinary(file.buffer, file.originalname)
      )
    );

    const pages = uploadResults.map((result, i) => ({
      imageUrl:   result.secure_url,
      publicId:   result.public_id,
      filter:     filterArr[i] || "original",
      pageNumber: i + 1,
    }));

    const document = await Document.create({
      visitorId:  req.visitor.visitorId,
      title:      title || `DocNo_${Date.now()}`,
      pages,
      totalPages: pages.length,
      mode:       mode || (pages.length > 1 ? "batch" : "single"),
    });

    // Increment visitor scan count
    await Visitor.findOneAndUpdate(
      { visitorId: req.visitor.visitorId },
      { $inc: { totalScans: 1 } }
    );

    console.log(`📄 Document saved: ${document.title} (${pages.length} pages)`);
    res.status(201).json({ success: true, document });
  } catch (err) {
    console.error("❌ Upload error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── READ: Get all documents for visitor ───────────────────────────────────
// GET /api/documents
const getDocuments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const documents = await Document.find({
      visitorId: req.visitor.visitorId,
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Document.countDocuments({
      visitorId: req.visitor.visitorId,
    });

    res.json({
      success: true,
      documents,
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── READ: Get single document ──────────────────────────────────────────────
// GET /api/documents/:id
const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id:       req.params.id,
      visitorId: req.visitor.visitorId,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.json({ success: true, document });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── UPDATE: Rename document title ──────────────────────────────────────────
// PATCH /api/documents/:id/title
const renameDocument = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Title cannot be empty",
      });
    }

    const document = await Document.findOneAndUpdate(
      { _id: req.params.id, visitorId: req.visitor.visitorId },
      { title: title.trim() },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    res.json({
      success: true,
      message: "Document renamed successfully",
      document,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE: Delete document + Cloudinary images ────────────────────────────
// DELETE /api/documents/:id
const deleteDocument = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id:       req.params.id,
      visitorId: req.visitor.visitorId,
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Delete all pages from Cloudinary
    await Promise.all(
      document.pages.map((page) =>
        cloudinary.uploader.destroy(page.publicId)
      )
    );

    await document.deleteOne();

    res.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  uploadDocument,
  getDocuments,
  getDocumentById,
  renameDocument,
  deleteDocument,
};