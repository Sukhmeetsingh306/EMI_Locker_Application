const mongoose = require('mongoose');

const keyPriceSchema = new mongoose.Schema(
  {
    packageName: { type: String, required: true, unique: true }, // e.g., "Starter", "Business", "Enterprise"
    keys: { type: Number, required: true, unique: true }, // Number of keys (100, 500, 1000)
    price: { type: Number, required: true }, // Price in rupees
    isActive: { type: Boolean, default: true }, // Enable/disable package
    description: { type: String }, // Optional description
  },
  { timestamps: true }
);

module.exports = mongoose.model('KeyPrice', keyPriceSchema);

