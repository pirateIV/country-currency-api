const express = require("express")
const router = express.Router()
const countriesController = require("../controllers/countriesController")
const { validateCountry } = require("../middleware/validation")

// Refresh countries data
router.post("/refresh", countriesController.refreshCountries)

// Get all countries with filters and sorting
router.get("/", countriesController.getAllCountries)


// Get summary image
router.get("/image/summary", countriesController.getSummaryImage)

// Get country by name
router.get("/:name", countriesController.getCountryByName)

// Delete country
router.delete("/:name", countriesController.deleteCountry)

module.exports = router
