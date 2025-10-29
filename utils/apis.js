const axios = require("axios");

const COUNTRIES_API = "https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies"
const EXCHANGE_RATES_API = "https://open.er-api.com/v6/latest/USD"

exports.fetchCountries = async () => {
  try {
    const response = await axios.get(COUNTRIES_API, { timeout: 10000 })
    return response.data
  } catch (error) {
    console.error("Error fetching countries:", error.message)
    return null
  }
}

exports.fetchExchangeRates = async () => {
  try {
    const response = await axios.get(EXCHANGE_RATES_API, { timeout: 10000 })
    return response.data
  } catch (error) {
    console.error("Error fetching exchange rates:", error.message)
    return null
  }
}
