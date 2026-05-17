const mongoose = require("mongoose");

const PageSchema = new mongoose.Schema({
  imageUrl:    { type: String, required: true }, // Cloudinary URL
  publicId:    { type: String, required: true }, // Cloudinary public_id
  filter:      { type: String, default: "original" },
  ocrText:     { type: String, default: "" },
  pageNumber:  { type: Number, required: true },
});

const DocumentSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Untitled Document",
    },
    pages: [PageSchema],
    totalPages: {
      type: Number,
      default: 1,
    },
    mode: {
      type: String,
      enum: ["single", "batch"],
      default: "single",
    },
    wordFileUrl:  { type: String, default: null }, // converted Word file
    pdfFileUrl:   { type: String, default: null }, // converted PDF file
    tags: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", DocumentSchema);