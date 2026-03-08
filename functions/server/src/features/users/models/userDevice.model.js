const mongoose = require('mongoose');

const userDeviceSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'ClientUser', 
      required: true,
      unique: true 
    }, // One device per user
    deviceId: { 
      type: String 
    }, // Optional for lock integration
    deviceLocked: { 
      type: Boolean, 
      default: false 
    },
    fcmToken: {
      type: String,
      default: null
    }, // FCM token for push notifications
  },
  { 
    timestamps: true 
  }
);

// Index for efficient queries
userDeviceSchema.index({ deviceLocked: 1 });

module.exports = mongoose.model('UserDevice', userDeviceSchema);

