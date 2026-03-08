const mongoose = require('mongoose');

const keyPackageSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    keyPrice: { type: mongoose.Schema.Types.ObjectId, ref: 'KeyPrice', required: true },
    // Keeping packageType only as a denormalized filter for backwards compatibility.
    packageType: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('KeyPackage', keyPackageSchema);

