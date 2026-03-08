const Admin = require('../../admins/models/admin.model');
const { generateUPIQRCode } = require('../../../utils/qrcode');

exports.updatePaymentConfig = async (adminId, config) => {
  const { 
    razorpayEnabled, 
    qrCodeEnabled,
    bankDetailsEnabled,
    superAdminRazorpayId, 
    upiId,
    razorpayKeyId,
    razorpayKeySecret,
    bankAccountNumber,
    bankIfsc,
    bankAccountHolderName
  } = config;

  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new Error('Admin not found');
  }

  // Update payment method selection
  if (razorpayEnabled !== undefined) admin.razorpayEnabled = razorpayEnabled;
  if (qrCodeEnabled !== undefined) admin.qrCodeEnabled = qrCodeEnabled;
  if (bankDetailsEnabled !== undefined) admin.bankDetailsEnabled = bankDetailsEnabled;
  
  // Update Razorpay credentials with validation
  if (razorpayKeyId !== undefined) {
    const trimmedKeyId = razorpayKeyId?.toString().trim() || null;
    
    // Validate Key ID format if provided
    if (trimmedKeyId && !trimmedKeyId.startsWith('rzp_')) {
      throw new Error('Invalid Razorpay Key ID format. Key ID must start with "rzp_" (for live) or "rzp_test_" (for test). Example: rzp_test_1234567890 or rzp_live_1234567890');
    }
    
    admin.razorpayKeyId = trimmedKeyId;
  }
  
  if (razorpayKeySecret !== undefined) {
    const trimmedKeySecret = razorpayKeySecret?.toString().trim() || null;
    
    // Validate Key Secret length if provided
    if (trimmedKeySecret && trimmedKeySecret.length < 20) {
      throw new Error('Invalid Razorpay Key Secret. Key Secret must be at least 20 characters long.');
    }
    
    admin.razorpayKeySecret = trimmedKeySecret;
  }
  
  // If Razorpay is being enabled, ensure credentials are provided
  if (razorpayEnabled && !admin.razorpayKeyId && !admin.razorpayKeySecret) {
    throw new Error('Razorpay Key ID and Key Secret are required when enabling Razorpay payments.');
  }
  
  // Update UPI ID and generate QR code if provided
  if (upiId !== undefined) {
    admin.upiId = upiId || null;
    // Generate QR code if UPI ID is provided and QR code is enabled
    if (upiId && qrCodeEnabled) {
      try {
        const qrCodeDataUrl = await generateUPIQRCode(upiId);
        // Store the data URL (or you can upload to S3 if needed)
        // For now, we'll generate it on-demand in the getter
      } catch (error) {
        console.error('Failed to generate QR code:', error);
        // Don't throw error, just log it
      }
    }
  }

  // Update Bank Details
  if (bankAccountNumber !== undefined) {
    admin.bankAccountNumber = bankAccountNumber || null;
  }
  if (bankIfsc !== undefined) {
    admin.bankIfsc = bankIfsc || null;
  }
  if (bankAccountHolderName !== undefined) {
    admin.bankAccountHolderName = bankAccountHolderName || null;
  }
  
  if (superAdminRazorpayId !== undefined) admin.superAdminRazorpayId = superAdminRazorpayId;

  try {
    await admin.save();
    return admin;
  } catch (error) {
    console.error('Save error:', error);
    if (error.name === 'ValidationError') {
      throw new Error(`Validation error: ${Object.values(error.errors).map(e => e.message).join(', ')}`);
    }
    throw new Error('Failed to save payment configuration');
  }
};

exports.getPaymentConfig = async (adminId) => {
  const admin = await Admin.findById(adminId).select(
    'razorpayEnabled qrCodeEnabled bankDetailsEnabled superAdminRazorpayId upiId razorpayKeyId razorpayKeySecret bankAccountNumber bankIfsc bankAccountHolderName'
  );
  if (!admin) {
    throw new Error('Admin not found');
  }
  
  // Return the secret as plain text
  const config = admin.toObject();
  
  // Generate QR code data URL if UPI ID exists and QR code is enabled
  if (config.upiId && config.qrCodeEnabled) {
    try {
      config.qrCodeImage = await generateUPIQRCode(config.upiId);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      config.qrCodeImage = null;
    }
  } else {
    config.qrCodeImage = null;
  }
  
  return config;
};

// Get all admins' payment configs (for superadmin)
exports.getAllAdminsPaymentConfig = async () => {
  const admins = await Admin.find({ role: 'admin' })
    .select('name email mobile razorpayEnabled qrCodeEnabled bankDetailsEnabled razorpayKeyId razorpayKeySecret upiId bankAccountNumber bankIfsc bankAccountHolderName createdAt')
    .sort({ createdAt: -1 });
  
  // Generate QR codes for each admin if they have UPI ID
  const configs = await Promise.all(admins.map(async (admin) => {
    const config = admin.toObject();
    
    // Generate QR code if UPI ID exists and QR code is enabled
    if (config.upiId && config.qrCodeEnabled) {
      try {
        config.qrCodeImage = await generateUPIQRCode(config.upiId);
      } catch (error) {
        console.error(`Failed to generate QR code for admin ${admin._id}:`, error);
        config.qrCodeImage = null;
      }
    } else {
      config.qrCodeImage = null;
    }
    
    return config;
  }));
  
  return configs;
};

