const mongoose = require("mongoose");

const countrySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  capital: { type: String, default: null },
  region: { type: String, default: null },
  population: { type: Number, required: true },
  currency_code: { type: String, required: true },
  exchange_rate: { type: Number, required: true },
  estimated_gdp: { type: Number, default: 0 },
  flag_url: { type: String, default: null },
  last_refreshed_at: { type: Date, default: Date.now },
});

countrySchema.set("toJSON", {
  transform: function (doc, ret) {
    ret.id = doc._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Country = mongoose.model("Country", countrySchema);
module.exports = Country;
