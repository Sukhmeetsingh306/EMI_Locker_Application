const EMI = require('../../emi/models/emi.model');
const EMIPayment = require('../../emi/models/emi.payment.model');
const Admin = require('../../admins/models/admin.model');
const ClientUser = require('../models/user.model');
const UserDevice = require('../models/userDevice.model');
const EmiPaymentTransaction = require('../../paymentTransactions/models/emiPaymentTransaction.model');
const razorpayService = require('../../razorpay/services/razorpay.service');
const { generateUPIQRCode } = require('../../../utils/qrcode');
const { parsePagination, buildPaginationResponse, parseSort } = require('../../../utils/pagination');

/**
 * Create Razorpay order for user payment
 * @param {String} userId - User ID
 * @param {String} emiPaymentId - EMI Payment ID
 * @param {String} adminId - Admin ID (to get Razorpay credentials)
 * @returns {Promise<Object>} Razorpay order
 */
const createRazorpayOrder = async (userId, emiPaymentId, adminId) => {
  // Get EMI payment details first (needed for validation and amount)
  const emiPayment = await EMIPayment.findById(emiPaymentId).populate('emiId');
  if (!emiPayment) {
    throw new Error('EMI payment not found');
  }

  if (emiPayment.userId.toString() !== userId) {
    throw new Error('Unauthorized: Payment does not belong to this user');
  }

  if (emiPayment.status === 'paid') {
    throw new Error('This installment is already paid');
  }

  // Get amount - use payment amount if available, fallback to EMI totalAmount
  let amount = emiPayment.amount;
  if (!amount && emiPayment.emiId) {
    amount = emiPayment.emiId.totalAmount;
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    throw new Error('Invalid payment amount. EMI payment amount is missing or invalid.');
  }

  // Verify admin has Razorpay enabled
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new Error('Admin not found');
  }

  // Check if Razorpay is enabled
  if (!admin.razorpayEnabled) {
    throw new Error('Admin Razorpay payment is not enabled. Please enable Razorpay in admin settings.');
  }

  // Check if credentials are configured (trim to handle whitespace)
  const keyId = admin.razorpayKeyId?.toString().trim();
  const keySecret = admin.razorpayKeySecret?.toString().trim();

  // Validate key ID format (Razorpay key IDs typically start with 'rzp_' for live or 'rzp_test_' for test)
  const keyIdPrefix = keyId && keyId.startsWith('rzp_test_') ? 'TEST' : (keyId && keyId.startsWith('rzp_') ? 'LIVE' : 'INVALID');
  
  // Check if admin has valid credentials, otherwise fallback to super admin credentials
  const hasValidAdminCredentials = keyId && keySecret && keyId !== '' && keySecret !== '' && keyIdPrefix !== 'INVALID';
  
  // Razorpay receipt has max length 40; use a short, unique value
  const receipt = `emi_${String(emiPaymentId).slice(-8)}_${Date.now().toString().slice(-8)}`;
  
  if (!hasValidAdminCredentials) {
    // Fallback to super admin credentials if admin credentials are invalid/missing
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Admin Razorpay credentials are not configured and super admin credentials are also not available. Please configure Razorpay credentials.');
    }
    
    console.warn(`[Razorpay] ⚠️  Admin ${admin._id} (${admin.name || admin.email}) has invalid/missing Razorpay credentials. Falling back to super admin credentials.`);
    console.log(`[Razorpay] 🔑 Using SUPER ADMIN credentials (fallback mode)`);
    
    // Use super admin credentials instead (same as package order API)
    const order = await razorpayService.createOrder(amount, 'INR', receipt);
    
    return {
      order,
      emiPaymentId,
      amount
    };
  }

  // Log admin info for debugging (without exposing full credentials)
  console.log(`[Razorpay] 🔑 Using admin: ${admin._id} (${admin.name || admin.email})`);
  console.log(`[Razorpay] 📋 Key ID format: ${keyIdPrefix} | Key ID: ${keyId.substring(0, 12)}... | Key Secret length: ${keySecret.length} chars`);

  // Create Razorpay order using admin's credentials
  const order = await razorpayService.createOrderWithAdmin(
    adminId,
    amount,
    'INR',
    receipt
  );

  return {
    order,
    emiPaymentId,
    amount
  };
};

/**
 * Verify and complete Razorpay payment
 * @param {String} userId - User ID
 * @param {String} emiPaymentId - EMI Payment ID
 * @param {String} adminId - Admin ID
 * @param {Object} paymentData - Payment verification data
 * @returns {Promise<Object>} Updated EMI payment
 */
const verifyRazorpayPayment = async (userId, emiPaymentId, adminId, paymentData) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = paymentData;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new Error('Payment details are required');
  }

  // Verify payment signature using admin credentials
  const isValid = await razorpayService.verifyPaymentWithAdmin(
    adminId,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (!isValid) {
    throw new Error('Invalid payment signature');
  }

  // Get EMI payment
  const emiPayment = await EMIPayment.findById(emiPaymentId).populate('emiId');
  if (!emiPayment) {
    throw new Error('EMI payment not found');
  }

  if (emiPayment.userId.toString() !== userId) {
    throw new Error('Unauthorized');
  }

  if (emiPayment.status === 'paid') {
    throw new Error('This installment is already paid');
  }

  // Mark payment as paid
  emiPayment.status = 'paid';
  emiPayment.paidDate = new Date();
  emiPayment.razorpayOrderId = razorpayOrderId;
  emiPayment.razorpayPaymentId = razorpayPaymentId;
  emiPayment.razorpaySignature = razorpaySignature;
  await emiPayment.save();

  // Update EMI
  const emi = emiPayment.emiId;
  emi.paidInstallments += 1;

  // Check if all payments are completed
  if (emi.paidInstallments >= emi.totalInstallments) {
    emi.status = 'completed';

    // Check if user has other active EMIs
    const remainingActive = await EMI.countDocuments({
      user: userId,
      status: 'active',
      _id: { $ne: emi._id }
    });

    if (remainingActive === 0) {
      await UserDevice.findOneAndUpdate(
        { userId },
        { deviceLocked: false },
        { upsert: true, new: true }
      );
    }
  }

  await emi.save();

  return { emiPayment, emi };
};

/**
 * Get QR code for user payment
 * @param {String} userId - User ID
 * @param {String} emiPaymentId - EMI Payment ID
 * @param {String} adminId - Admin ID
 * @returns {Promise<Object>} QR code data
 */
const getQRCodePayment = async (userId, emiPaymentId, adminId) => {
  // Verify admin has QR code enabled
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new Error('Admin not found');
  }

  if (!admin.qrCodeEnabled || !admin.upiId) {
    throw new Error('Admin QR code payment is not configured');
  }

  // Get EMI payment details
  const emiPayment = await EMIPayment.findById(emiPaymentId).populate('emiId');
  if (!emiPayment) {
    throw new Error('EMI payment not found');
  }

  if (emiPayment.userId.toString() !== userId) {
    throw new Error('Unauthorized: Payment does not belong to this user');
  }

  if (emiPayment.status === 'paid') {
    throw new Error('This installment is already paid');
  }

  // Get amount - use payment amount if available, fallback to EMI totalAmount
  let amount = emiPayment.amount;
  if (!amount && emiPayment.emiId) {
    amount = emiPayment.emiId.totalAmount;
  }
  if (!amount || isNaN(amount) || amount <= 0) {
    throw new Error('Invalid payment amount. EMI payment amount is missing or invalid.');
  }

  // Generate QR code with amount
  const qrCodeImage = await generateUPIQRCode(admin.upiId, amount);

  return {
    qrCodeImage,
    upiId: admin.upiId,
    amount,
    emiPaymentId
  };
};

/**
 * Submit QR code payment for verification (creates pending transaction)
 * @param {String} userId - User ID
 * @param {String} emiPaymentId - EMI Payment ID
 * @param {String} transactionId - UPI transaction ID
 * @returns {Promise<Object>} Created payment transaction
 */
const verifyQRCodePayment = async (userId, emiPaymentId, transactionId) => {
  if (!transactionId) {
    throw new Error('Transaction ID is required');
  }

  // Get EMI payment with EMI details
  const emiPayment = await EMIPayment.findById(emiPaymentId).populate('emiId');
  if (!emiPayment) {
    throw new Error('EMI payment not found');
  }

  if (emiPayment.userId.toString() !== userId) {
    throw new Error('Unauthorized');
  }

  if (emiPayment.status === 'paid') {
    throw new Error('This installment is already paid');
  }

  // Check if there's already a pending transaction for this payment
  const existingTransaction = await EmiPaymentTransaction.findOne({
    emiPayment: emiPaymentId,
    status: 'pending'
  });

  if (existingTransaction) {
    throw new Error('A pending payment request already exists for this installment');
  }

  const emi = emiPayment.emiId;
  const adminId = emi.createdBy?._id || emi.createdBy;

  if (!adminId) {
    throw new Error('Admin not found for this EMI');
  }

  const amount = emiPayment.amount || emi.totalAmount;

  // Create pending payment transaction
  const paymentTransaction = await EmiPaymentTransaction.create({
    emi: emi._id,
    emiPayment: emiPaymentId,
    user: userId,
    admin: adminId,
    amount,
    paymentMethod: 'qr_code',
    status: 'pending',
    transactionId
  });

  return { paymentTransaction, emiPayment, emi };
};

/**
 * Submit bank transfer payment for verification (creates pending transaction)
 * @param {String} userId - User ID
 * @param {String} emiPaymentId - EMI Payment ID
 * @param {String} transactionId - Bank transaction ID/reference number
 * @returns {Promise<Object>} Created payment transaction
 */
const submitBankTransferPayment = async (userId, emiPaymentId, transactionId) => {
  if (!transactionId) {
    throw new Error('Transaction ID is required');
  }

  // Get EMI payment with EMI details
  const emiPayment = await EMIPayment.findById(emiPaymentId).populate('emiId');
  if (!emiPayment) {
    throw new Error('EMI payment not found');
  }

  if (emiPayment.userId.toString() !== userId) {
    throw new Error('Unauthorized');
  }

  if (emiPayment.status === 'paid') {
    throw new Error('This installment is already paid');
  }

  // Check if there's already a pending transaction for this payment
  const existingTransaction = await EmiPaymentTransaction.findOne({
    emiPayment: emiPaymentId,
    status: 'pending'
  });

  if (existingTransaction) {
    throw new Error('A pending payment request already exists for this installment');
  }

  const emi = emiPayment.emiId;
  const adminId = emi.createdBy?._id || emi.createdBy;

  if (!adminId) {
    throw new Error('Admin not found for this EMI');
  }

  const amount = emiPayment.amount || emi.totalAmount;

  // Create pending payment transaction
  const paymentTransaction = await EmiPaymentTransaction.create({
    emi: emi._id,
    emiPayment: emiPaymentId,
    user: userId,
    admin: adminId,
    amount,
    paymentMethod: 'bank_transfer',
    status: 'pending',
    transactionId
  });

  return { paymentTransaction, emiPayment, emi };
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getQRCodePayment,
  verifyQRCodePayment,
  submitBankTransferPayment,
};

