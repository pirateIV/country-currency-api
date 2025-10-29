const mongoose = require("mongoose")

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/countries_db")
    console.log("Connected to MongoDB")
  } catch (error) {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  }
}

module.exports = connectDatabase;