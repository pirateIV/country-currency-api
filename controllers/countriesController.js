const Country = require("../models/Country")
const { fetchCountries, fetchExchangeRates } = require("../utils/apis")
// const { generateSummaryImage } = require("../utils/imageGenerator")

// Refresh countries and exchange rates
exports.refreshCountries = async (req, res, next) => {
  try {
    // Fetch external data
    const countriesData = await fetchCountries()
    const exchangeRates = await fetchExchangeRates()

    if (!countriesData || !exchangeRates) {
      return res.status(503).json({
        error: "External data source unavailable",
        details: "Could not fetch data from external APIs",
      })
    }

    try {
      for (const country of countriesData) {
        const { name, capital, region, population, currencies, flag } = country

        let currencyCode = null
        let exchangeRate = null
        let estimatedGdp = 0

        // Handle currency
        if (currencies && currencies.length > 0) {
          currencyCode = currencies[0].code
          exchangeRate = exchangeRates.rates[currencyCode] || null

          if (exchangeRate) {
            const randomMultiplier = Math.floor(Math.random() * 1001) + 1000
            estimatedGdp = (population * randomMultiplier) / exchangeRate
          }
        }

        // Upsert country using Mongoose
        await Country.findOneAndUpdate(
          { name },
          {
            name,
            capital,
            region,
            population,
            currencyCode,
            exchangeRate,
            estimatedGdp,
            flagUrl: flag,
          },
          { upsert: true, new: true },
        )
      }

      res.json({
        message: "Countries data refreshed successfully",
        total_countries: countriesData.length,
      })
    } catch (error) {
      throw error
    } 
  } catch (error) {
    next(error)
  }
}

// Get all countries with filters and sorting
exports.getAllCountries = async (req, res, next) => {
  try {
    const { region, currency, sort } = req.query
    const query = {}

    if (region) {
      query.region = region
    }

    if (currency) {
      query.currencyCode = currency
    }

    let mongooseQuery = Country.find(query)

    // Sorting
    if (sort === "gdp_desc") {
      mongooseQuery = mongooseQuery.sort({ estimatedGdp: -1 })
    } else if (sort === "gdp_asc") {
      mongooseQuery = mongooseQuery.sort({ estimatedGdp: 1 })
    } else if (sort === "population_desc") {
      mongooseQuery = mongooseQuery.sort({ population: -1 })
    } else if (sort === "population_asc") {
      mongooseQuery = mongooseQuery.sort({ population: 1 })
    } else {
      mongooseQuery = mongooseQuery.sort({ name: 1 })
    }

    const countries = await mongooseQuery.exec()
    res.json(countries)
  } catch (error) {
    next(error)
  }
}

// Get country by name
exports.getCountryByName = async (req, res, next) => {
  try {
    const { name } = req.params
    const country = await Country.findOne({ name: new RegExp(`^${name}$`, "i") })

    if (!country) {
      return res.status(404).json({ error: "Country not found" })
    }

    res.json(country)
  } catch (error) {
    next(error)
  }
}

// Delete country
exports.deleteCountry = async (req, res, next) => {
  try {
    const { name } = req.params
    const result = await Country.findOneAndDelete({ name: new RegExp(`^${name}$`, "i") })

    if (!result) {
      return res.status(404).json({ error: "Country not found" })
    }

    res.json({ message: "Country deleted successfully" })
  } catch (error) {
    next(error)
  }
}

// Get summary image
exports.getSummaryImage = async (req, res, next) => {
  try {
    const fs = require("fs")
    const path = require("path")
    const imagePath = path.join(__dirname, "../cache/summary.png")

    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: "Summary image not found" })
    }

    res.sendFile(imagePath)
  } catch (error) {
    next(error)
  }
}
