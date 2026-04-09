const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  siteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Site', required: true },
  colors: {
    primary: { type: String, default: '#3b82f6' },
    secondary: { type: String, default: '#1f2937' },
    accent: { type: String, default: '#10b981' },
    background: { type: String, default: '#ffffff' },
    text: { type: String, default: '#000000' },
    neutrals: [String]
  },
  typography: {
    headingFont: { type: String, default: 'Inter, sans-serif' },
    bodyFont: { type: String, default: 'Inter, sans-serif' },
    baseSize: { type: String, default: '16px' },
    scale: [{
      label: String,
      size: String,
      weight: String
    }]
  },
  spacing: {
    baseUnit: { type: Number, default: 4 },
    scale: [Number]
  },
  locked: {
    colors: { type: [String], default: [] }, // Array of field names that are locked
    typography: { type: [String], default: [] },
    spacing: { type: [String], default: [] }
  },
  versionHistory: [{
    timestamp: { type: Date, default: Date.now },
    changeDescription: String,
    tokens: Object
  }]
}, { timestamps: true });

module.exports = mongoose.model('Token', tokenSchema);
