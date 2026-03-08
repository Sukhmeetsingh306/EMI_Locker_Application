const mongoose = require('mongoose');

const packagePaymentTransactionSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    keyPackage: { type: mongoose.Schema.Types.ObjectId, ref: 'KeyPackage', required: true },
    keyPrice: { type: mongoose.Schema.Types.ObjectId, ref: 'KeyPrice', required: true },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cash'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    transactionId: { type: String }, // For QR code payments
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('PackagePaymentTransaction', packagePaymentTransactionSchema);

