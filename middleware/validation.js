exports.validateCountry = (req, res, next) => {
  const { name, population, currency_code } = req.body
  const errors = {}

  if (!name) errors.name = "is required"
  if (!population) errors.population = "is required"
  if (!currency_code) errors.currency_code = "is required"

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors,
    })
  }

  next()
}
