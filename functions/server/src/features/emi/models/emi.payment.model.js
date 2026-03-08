const mongoose = require('mongoose');

const emiPaymentSchema = new mongoose.Schema(
  {
    emiId: { type: mongoose.Schema.Types.ObjectId, ref: 'EMI', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientUser', required: true },

    installmentNumber: { type: Number, required: true }, // Sequential installment number (1, 2, 3, ...)

    dueDate: { type: Date, required: true },
    paidDate: { type: Date },

    // Flexible payment amount - can be percentage or fixed amount
    amount: { type: Number, required: true }, // Actual amount to pay for this installment
    percentage: { type: Number }, // Optional: percentage of total amount (for reference)

    extendDays: { type: Number, default: 0 },
    extendReason: { type: String },
    extendedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    extendedOn: { type: Date },

    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending',
    },

    alertSent: { type: Boolean, default: false },
    secondAlertSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for faster queries
emiPaymentSchema.index({ emiId: 1, installmentNumber: 1 });
emiPaymentSchema.index({ dueDate: 1 });

module.exports = mongoose.model('EMIPayment', emiPaymentSchema);
