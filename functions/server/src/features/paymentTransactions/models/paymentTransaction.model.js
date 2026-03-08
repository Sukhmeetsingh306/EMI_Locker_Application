const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema(
  {
    fromAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    toSuperAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'qr_code', 'bank_transfer'],
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
    description: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaymentTransaction', paymentTransactionSchema);

