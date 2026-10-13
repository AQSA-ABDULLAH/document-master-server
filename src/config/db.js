
const dns = require("node:dns");
const mongoose = require("mongoose");

// Configure DNS before Mongoose starts connecting.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);

    isConnected = true;
    console.log("MongoDB connected successfully");
  } catch (err) {
    isConnected = false;
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
};

module.exports = connectDB;
