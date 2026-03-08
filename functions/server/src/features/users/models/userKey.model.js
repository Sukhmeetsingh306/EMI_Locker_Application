const mongoose = require('mongoose');

const userKeySchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'ClientUser', 
      required: true,
      unique: true 
    }, // One key per user
    userKey: { 
      type: String, 
      unique: true, 
      sparse: true,
      required: true 
    }, // Unique key assigned by admin
    keyAssignedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Admin',
      required: true 
    }, // Admin who assigned the key
    keyAssignedAt: { 
      type: Date, 
      default: Date.now,
      required: true 
    }, // When the key was assigned
    keyExpiryDate: { 
      type: Date, 
      required: false 
    }, // When the key expires (1 year from activation). Null means key is not activated yet.
    isExpired: {
      type: Boolean,
      default: false
    }, // Flag to mark if key is expired (updated by cron)
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for checking if key is expired (real-time check)
userKeySchema.virtual('isKeyExpired').get(function() {
  if (this.isExpired) return true; // Already marked as expired by cron
  if (!this.keyExpiryDate) return false;
  return new Date() > this.keyExpiryDate;
});

// Virtual for checking if key is active
userKeySchema.virtual('isKeyActive').get(function() {
  if (!this.userKey) return false;
  if (!this.keyExpiryDate) return false; // No expiry date means key is not activated
  if (this.isExpired) return false;
  return new Date() <= this.keyExpiryDate;
});

userKeySchema.methods.toJSON = function toJSON() {
  const obj = this.toObject();
  delete obj.__v;
  // Include virtuals
  obj.isKeyExpired = this.isKeyExpired;
  obj.isKeyActive = this.isKeyActive;
  return obj;
};

// Index for efficient queries
// Note: userId and userKey already have indexes from unique: true
userKeySchema.index({ keyExpiryDate: 1 });
userKeySchema.index({ isExpired: 1 });

module.exports = mongoose.model('UserKey', userKeySchema);

