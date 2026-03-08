const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    aadhar: { type: String, required: true },
    pan: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String },

    password: { type: String, required: true }, // hashed

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound unique indexes: prevent duplicates within same admin
// But allow same user to be added by different admins
userSchema.index({ createdBy: 1, mobile: 1 }, { unique: true });
userSchema.index({ createdBy: 1, aadhar: 1 }, { unique: true });
userSchema.index({ createdBy: 1, pan: 1 }, { unique: true });
// Email is optional, so only add unique index if email exists
userSchema.index({ createdBy: 1, email: 1 }, { unique: true, sparse: true });

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.isPasswordMatch = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('ClientUser', userSchema);
