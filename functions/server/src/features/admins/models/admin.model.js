const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, unique: true, sparse: true },
  mobile: { type: String, unique: true, sparse: true },

  password: { type: String, required: true },

  role: { type: String, enum: ["superadmin", "admin"], default: "admin" },

  // Status: 1 = active, 0 = blocked
  status: { type: Number, enum: [0, 1], default: 1 },

  // Key Management
  totalKeys: { type: Number, default: 0 }, // Total keys purchased/received
  usedKeys: { type: Number, default: 0 }, // Keys used for user creation
  availableKeys: { type: Number, default: 0 }, // Available keys (totalKeys - usedKeys)

  // Payment Settings
  razorpayEnabled: { type: Boolean, default: false }, // Admin can accept Razorpay from users
  qrCodeEnabled: { type: Boolean, default: false }, // Admin can accept QR code from users
  bankDetailsEnabled: { type: Boolean, default: false }, // Admin can accept bank transfer payments
  superAdminRazorpayId: { type: String }, // Super Admin's Razorpay ID for admin payments
  upiId: { type: String }, // UPI ID for QR code generation (e.g., user@paytm, 1234567890@ybl)
  // Razorpay Credentials (for admin to accept payments from users)
  razorpayKeyId: { type: String }, // Admin's Razorpay Key ID
  razorpayKeySecret: { type: String }, // Admin's Razorpay Key Secret
  // Bank Details (for admin to accept bank transfer payments)
  bankAccountNumber: { type: String }, // Bank account number
  bankIfsc: { type: String }, // IFSC code
  bankAccountHolderName: { type: String }, // Account holder name

  // Created by (for tracking which superadmin or agent created this admin - can be null)
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    refPath: 'creatorType',
    default: null 
  },
  
  // Type of creator (Admin for Super Admin, Agent for Agent)
  creatorType: { 
    type: String, 
    enum: ['Admin', 'Agent'],
    default: null 
  },
  
  // Agent who enrolled this admin
  enrolledBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Agent',
    default: null 
  },
  
  // Enrollment date
  enrolledAt: { 
    type: Date,
    default: null 
  }
}, { timestamps: true });

// Hash password on create or save
adminSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Hash password on update (findOneAndUpdate)
adminSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();

  if (update.password) {
    const hashedPassword = await bcrypt.hash(update.password, 10);
    this.setUpdate({ ...update, password: hashedPassword });
  }

  // Calculate availableKeys on update
  if (update.totalKeys !== undefined || update.usedKeys !== undefined) {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
      const totalKeys = update.totalKeys !== undefined ? update.totalKeys : docToUpdate.totalKeys;
      const usedKeys = update.usedKeys !== undefined ? update.usedKeys : docToUpdate.usedKeys;
      update.availableKeys = Math.max(0, totalKeys - usedKeys);
    }
  }
});

// Compare password
adminSchema.methods.isPasswordMatch = function (pwd) {
  return bcrypt.compare(pwd, this.password);
};

// Calculate available keys before saving
adminSchema.pre("save", async function () {
  if (this.isModified("totalKeys") || this.isModified("usedKeys")) {
    this.availableKeys = Math.max(0, this.totalKeys - this.usedKeys);
  }
});

// Remove sensitive info
adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

// Method to consume a key
adminSchema.methods.consumeKey = async function () {
  if (this.availableKeys <= 0) {
    throw new Error("No available keys");
  }
  this.usedKeys += 1;
  this.availableKeys -= 1;
  await this.save();
  return this;
};

// Method to add keys
adminSchema.methods.addKeys = async function (amount) {
  this.totalKeys += amount;
  this.availableKeys += amount;
  await this.save();
  return this;
};

module.exports = mongoose.model("Admin", adminSchema);
