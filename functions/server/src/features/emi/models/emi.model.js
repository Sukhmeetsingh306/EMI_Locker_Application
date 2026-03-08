const mongoose = require('mongoose');

const emiSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'ClientUser', required: true },

    principalAmount: { type: Number, required: true }, // Base amount before interest
    interestPercentage: { type: Number, required: true }, // Interest/markup percentage
    totalAmount: { type: Number, required: true }, // Principal + (Principal × Interest%)
    
    description: { type: String, required: true }, // EMI description instead of products

    billNumber: { type: String, unique: true, required: true },

    startDate: { type: Date, required: true },
    
    // Payment schedule configuration
    // Required for equal installments, optional for custom schedules
    paymentScheduleType: { 
      type: String, 
      enum: ['1', '3', '6', '9', '12', '18'], // Duration in months
      required: false // Optional for custom schedules
    },
    
    dueDates: [{ 
      type: Number, // Day of month (1-31) - can have multiple dates per month
      min: 1,
      max: 31
    }], // e.g., [5, 15, 25] for 5th, 15th, 25th of each month
    // Note: dueDates can be empty array [] for custom schedules (dates are in paymentSchedule items)
    // Required for equal installments mode

    paidInstallments: { type: Number, default: 0 },
    totalInstallments: { type: Number, required: true }, // Total number of payment installments

    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }, // Track which admin created this EMI
  },
  { timestamps: true }
);

module.exports = mongoose.model('EMI', emiSchema);
