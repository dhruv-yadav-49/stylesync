const mongoose = require('mongoose');

const siteSchema = new mongoose.Schema({
  url: { type: String, required: true },
  name: { type: String },
  screenshot: { type: String }, // Optional path to screenshot
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Site', siteSchema);
