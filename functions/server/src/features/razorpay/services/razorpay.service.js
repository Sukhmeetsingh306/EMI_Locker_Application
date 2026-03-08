const razorpay = require('razorpay');
const crypto = require('crypto');
const Admin = require('../../admins/models/admin.model');

// Initialize Razorpay with super admin credentials (for package purchases)
let superAdminRazorpayInstance = null;

const initializeSuperAdminRazorpay = () => {
  if (!superAdminRazorpayInstance && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    superAdminRazorpayInstance = new razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return superAdminRazorpayInstance;
};

// Initialize Razorpay with admin credentials (for user payments)
const initializeAdminRazorpay = async (adminId) => {
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new Error('Admin not found');
  }

  // Trim whitespace and check if credentials exist
  const keyId = admin.razorpayKeyId?.toString().trim();
  const keySecret = admin.razorpayKeySecret?.toString().trim();

  if (!keyId || !keySecret || keyId === '' || keySecret === '') {
    throw new Error('Admin Razorpay credentials not configured. Please set razorpayKeyId and razorpayKeySecret in admin settings.');
  }

  // Check key format
  const isTestKey = keyId.startsWith('rzp_test_');
  const isLiveKey = keyId.startsWith('rzp_') && !keyId.startsWith('rzp_test_');
  const keyType = isTestKey ? 'TEST' : (isLiveKey ? 'LIVE' : 'INVALID');
  
  if (keyType === 'INVALID') {
    console.error(`[Razorpay] ❌ INVALID Key ID format for Admin ${admin._id}!`);
    console.error(`[Razorpay] Expected: 'rzp_test_...' (test) or 'rzp_...' (live)`);
    console.error(`[Razorpay] Got: '${keyId.substring(0, 25)}...'`);
  } else {
    console.log(`[Razorpay] ✅ Key ID format valid (${keyType} mode)`);
  }

  // Warn about key secret length but let Razorpay validate
  if (keySecret.length < 20) {
    console.warn(`[Razorpay] ⚠️  Warning: Admin ${admin._id} Key Secret appears to be too short (${keySecret.length} chars). Expected: 20+ characters.`);
  }

  try {
    const instance = new razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    return instance;
  } catch (error) {
    throw new Error(`Failed to initialize Razorpay instance: ${error.message}`);
  }
};

// Create order using super admin credentials (for package purchases)
exports.createOrder = async (amount, currency = 'INR', receipt = null) => {
  const instance = initializeSuperAdminRazorpay();
  if (!instance) {
    throw new Error('Razorpay not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
  }

  const options = {
    amount: amount * 100, // Convert to paise
    currency,
    receipt: receipt || `receipt_${Date.now()}`,
  };

  try {
    const order = await instance.orders.create(options);
    return order;
  } catch (error) {
    // Razorpay often puts the real reason in error.error.description
    const reason = error?.error?.description || error?.message || 'Unknown Razorpay error';
    throw new Error(`Razorpay order creation failed: ${reason}`);
  }
};

// Create order using admin credentials (for user payments)
exports.createOrderWithAdmin = async (adminId, amount, currency = 'INR', receipt = null) => {
  let instance;
  try {
    instance = await initializeAdminRazorpay(adminId);
  } catch (error) {
    // Re-throw initialization errors as-is
    throw error;
  }

  // Validate amount
  if (!amount || isNaN(amount) || amount <= 0) {
    throw new Error('Invalid amount. Amount must be a positive number.');
  }

  const options = {
    amount: Math.round(amount * 100), // Convert to paise and ensure integer
    currency,
    receipt: receipt || `receipt_${Date.now()}`,
  };

  try {
    const order = await instance.orders.create(options);
    return order;
  } catch (error) {
    // Enhanced error handling for Razorpay errors
    let reason = 'Unknown Razorpay error';
    let errorCode = null;
    
    if (error?.error) {
      // Razorpay API error structure
      reason = error.error.description || error.error.reason || error.error.message || error.message;
      errorCode = error.error.code || error.error.field || null;
    } else if (error?.message) {
      reason = error.message;
    }
    
    // Log full error for debugging
    console.error('[Razorpay] Order creation failed:', {
      adminId,
      amount: options.amount,
      currency: options.currency,
      errorCode,
      reason,
      fullError: error
    });
    
    // Provide more context for authentication errors
    if (reason.toLowerCase().includes('authentication') || 
        reason.toLowerCase().includes('unauthorized') ||
        reason.toLowerCase().includes('invalid') && reason.toLowerCase().includes('key')) {
      throw new Error(`Razorpay authentication failed. Please verify the admin's Razorpay Key ID and Key Secret are correct and match (test keys with test keys, live keys with live keys). Error: ${reason}`);
    }
    
    throw new Error(`Razorpay order creation failed: ${reason}`);
  }
};

// Verify payment using super admin credentials
exports.verifyPayment = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error('Razorpay not configured');
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature;
};

// Verify payment using admin credentials
exports.verifyPaymentWithAdmin = async (adminId, razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  const admin = await Admin.findById(adminId);
  if (!admin || !admin.razorpayKeySecret) {
    throw new Error('Admin Razorpay credentials not configured');
  }

  const generatedSignature = crypto
    .createHmac('sha256', admin.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature;
};

// Get payment details using super admin credentials
exports.getPaymentDetails = async (paymentId) => {
  const instance = initializeSuperAdminRazorpay();
  if (!instance) {
    throw new Error('Razorpay not configured');
  }

  try {
    const payment = await instance.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    throw new Error(`Failed to fetch payment: ${error.message}`);
  }
};

// Get payment details using admin credentials
exports.getPaymentDetailsWithAdmin = async (adminId, paymentId) => {
  const instance = await initializeAdminRazorpay(adminId);

  try {
    const payment = await instance.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    throw new Error(`Failed to fetch payment: ${error.message}`);
  }
};

