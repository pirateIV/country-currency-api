require("dotenv").config()
const express = require("express")
const connectDatabase = require("./utils/connect")
const errorHandler = require("./middleware/errorHandler")

const app = express()
const PORT = process.env.PORT || 3000

connectDatabase()

// Middleware
app.use(express.json())

// Routes

// Error handling middleware
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
