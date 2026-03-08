const mongoose = require('mongoose');

const deviceLockSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientUser', required: true },
    emiId: { type: mongoose.Schema.Types.ObjectId, ref: 'EMI' },

    requestedOn: { type: Date, default: Date.now },
    processed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DeviceLockRequest', deviceLockSchema);
