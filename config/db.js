const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(
  "mongodb://localhost:27017/document-master"
);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // Exit if DB fails
  }
};

module.exports = connectDB;
// mongodb+srv://islam-daily02:FtBNJ0yjJukC3vwq@cluster0.yyjamcp.mongodb.net/islam-daily?retryWrites=true&w=majority