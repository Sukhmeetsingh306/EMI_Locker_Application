const mongoose = require('mongoose');

const cashDepositSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  keyPrice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'KeyPrice',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  type: {
    type: String,
    enum: ['cash_deposit_request'],
    default: 'cash_deposit_request'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better query performance
cashDepositSchema.index({ agent: 1, status: 1 });
cashDepositSchema.index({ admin: 1, status: 1 });
cashDepositSchema.index({ requestedAt: -1 });

module.exports = mongoose.model('CashDeposit', cashDepositSchema);
