const mongoose = require('mongoose');

const emiPaymentTransactionSchema = new mongoose.Schema(
  {
    emi: { type: mongoose.Schema.Types.ObjectId, ref: 'EMI', required: true },
    emiPayment: { type: mongoose.Schema.Types.ObjectId, ref: 'EMIPayment' }, // specific installment
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientUser', required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }, // who processed/owns the EMI
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'qr_code', 'cash', 'bank_transfer'],
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
    transactionId: { type: String }, // For QR code / cash reference
    notes: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmiPaymentTransaction', emiPaymentTransactionSchema);

