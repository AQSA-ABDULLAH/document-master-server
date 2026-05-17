const mongoose = require("mongoose");

const VisitorSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      required: [true, "Visitor ID is required"],
      unique: true,
      index: true,
      trim: true,
    },
    deviceInfo: {
      platform: {
        type: String,
        enum: ["android", "ios", "unknown"],
        default: "unknown",
      },
      version: {
        type: String,
        default: "unknown",
      },
      deviceModel: {
        type: String,
        default: "unknown",
      },
    },
    totalScans: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("Visitor", VisitorSchema);