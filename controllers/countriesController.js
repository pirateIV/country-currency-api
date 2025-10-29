const Country = require("../models/Country");
const { fetchCountries, fetchExchangeRates } = require("../utils/apis");
const { generateSummaryImage } = require("../utils/imageGenerator");

// Compute GDP from population × random(1000–2000) ÷ exchange_rate
function estimateGdp(population, exchangeRate) {
  if (population == null || exchangeRate == null) return null;
  const randomMultiplier = Math.floor(Math.random() * 1001) + 1000;
  return (population * randomMultiplier) / exchangeRate;
}

exports.refreshCountries = async (req, res, next) => {
  try {
    const countriesData = await fetchCountries();
    const exchangeRates = await fetchExchangeRates();

    if (!countriesData) {
      return res.status(503).json({
        error: "External data source unavailable",
        details: "Could not fetch data from REST Countries API",
      });
    }
    if (!exchangeRates) {
      return res.status(503).json({
        error: "External data source unavailable",
        details: "Could not fetch data from Exchange Rates API",
      });
    }

    const now = new Date();
    const docsToUpsert = [];

    for (const c of countriesData) {
      const { name, capital, region, population, currencies, flag } = c;

      if (!name || population == null) continue;

      let currencyCode = null;
      let exchangeRate = null;
      let estimatedGdp = null;

      if (Array.isArray(currencies) && currencies.length > 0) {
        currencyCode = currencies[0].code || null;
        if (currencyCode && exchangeRates?.rates) {
          exchangeRate = exchangeRates.rates[currencyCode] ?? null;
          estimatedGdp = exchangeRate
            ? estimateGdp(population, exchangeRate)
            : null;
        }
      }

      const updateDoc = {
        $set: {
          name,
          capital: capital || null,
          region: region || null,
          population,
          currency_code: currencyCode,
          exchange_rate: exchangeRate,
          estimated_gdp: estimatedGdp,
          flag_url: flag || null,
          last_refreshed_at: now,
        },
      };

      docsToUpsert.push({
        filter: { name: new RegExp(`^${escapeRegExp(name)}$`, "i") },
        update: updateDoc,
        options: { upsert: true, new: true },
      });
    }

    for (const item of docsToUpsert) {
      const existing = await Country.findOne(item.filter).exec();
      if (existing) {
        await Country.updateOne({ _id: existing._id }, item.update).exec();
      } else {
        await Country.create(item.update.$set);
      }
    }

    const totalCountries = docsToUpsert.length;
    const top5 = await Country.find({ estimated_gdp: { $ne: null } })
      .sort({ estimated_gdp: -1 })
      .limit(5)
      .select("name estimated_gdp")
      .lean()
      .exec();

    const summary = {
      total_countries: totalCountries,
      last_refreshed_at: now.toISOString(),
      top5: top5.map((t) => ({
        name: t.name,
        estimated_gdp: t.estimated_gdp,
      })),
    };

    try {
      await generateSummaryImage(summary);
    } catch (imgErr) {
      console.error("Image generation failed:", imgErr);
    }

    res.json({
      // message: "Countries data refreshed successfully",
      total_countries: totalCountries,
      last_refreshed_at: now.toISOString(),
    });
  } catch (err) {
    console.error(err);
    return next(err);
  }
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.getAllCountries = async (req, res, next) => {
  try {
    const { region, currency, sort } = req.query;
    const query = {};

    if (region) query.region = region;
    if (currency) query.currency_code = currency;

    let q = Country.find(query);

    if (sort === "gdp_desc") q = q.sort({ estimated_gdp: -1 });
    else if (sort === "gdp_asc") q = q.sort({ estimated_gdp: 1 });
    else if (sort === "population_desc") q = q.sort({ population: -1 });
    else if (sort === "population_asc") q = q.sort({ population: 1 });
    else q = q.sort({ name: 1 });

    const countries = await q.exec();
    res.json(countries);
  } catch (err) {
    next(err);
  }
};

exports.getCountryByName = async (req, res, next) => {
  try {
    const { name } = req.params;
    const country = await Country.findOne({
      name: new RegExp(`^${escapeRegExp(name)}$`, "i"),
    });
    if (!country)
      return res.status(404).json({ error: "Country not found" });
    res.json(country);
  } catch (err) {
    next(err);
  }
};

exports.deleteCountry = async (req, res, next) => {
  try {
    const { name } = req.params;
    const result = await Country.findOneAndDelete({
      name: new RegExp(`^${escapeRegExp(name)}$`, "i"),
    });
    if (!result)
      return res.status(404).json({ error: "Country not found" });
    res.json({ message: "Country deleted successfully" });
  } catch (err) {
    next(err);
  }
};

exports.getSummaryImage = async (req, res, next) => {
  try {
    const fs = require("fs");
    const path = require("path");
    const imagePath = path.join(__dirname, "../cache/summary.png");
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: "Summary image not found" });
    }
    return res.sendFile(imagePath);
  } catch (err) {
    next(err);
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const total = await Country.countDocuments().exec();
    const recent = await Country.findOne({
      last_refreshed_at: { $ne: null },
    })
      .sort({ last_refreshed_at: -1 })
      .select("last_refreshed_at")
      .lean()
      .exec();

    res.json({
      total_countries: total,
      last_refreshed_at: recent
        ? recent.last_refreshed_at.toISOString()
        : null,
    });
  } catch (err) {
    next(err);
  }
};
