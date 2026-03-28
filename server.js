//server.js

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db.js");

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

app.use("/api", visitorRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
module.exports = app;