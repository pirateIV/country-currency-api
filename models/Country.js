const mongoose = require("mongoose")

const countrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    capital: {
      type: String,
      trim: true,
    },
    region: {
      type: String,
      index: true,
    },
    population: {
      type: Number,
      required: true,
    },
    currencyCode: {
      type: String,
      index: true,
    },
    exchangeRate: {
      type: Number,
      default: null,
    },
    estimatedGdp: {
      type: Number,
      default: 0,
    },
    flagUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Country", countrySchema)
