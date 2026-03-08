const { success, failure } = require('../../../core/response');
const paymentService = require('../services/payment.service');
const EMI = require('../../emi/models/emi.model');
const EMIPayment = require('../../emi/models/emi.payment.model');

/**
 * Get user's pending payments
 * GET /users/payments/pending
 */
exports.getPendingPayments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { parsePagination, buildPaginationResponse, parseSort } = require('../../../utils/pagination');
    
    const { page, limit, skip } = parsePagination(req.query);
    const sort = parseSort(req.query, 'dueDate', 'asc');
    
    // Build filters
    const filters = {
      userId,
      status: 'pending'
    };
    
    // EMI filter
    if (req.query.emiId) {
      filters.emiId = req.query.emiId;
    }
    
    // Date range filters
    if (req.query.dueFrom) {
      filters.dueDate = { ...filters.dueDate, $gte: new Date(req.query.dueFrom) };
    }
    if (req.query.dueTo) {
      filters.dueDate = { ...filters.dueDate, $lte: new Date(req.query.dueTo) };
    }
    
    // Get total count
    const total = await EMIPayment.countDocuments(filters);
    
    // Get paginated data
    const pendingPayments = await EMIPayment.find(filters)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('emiId', 'billNumber totalAmount');
    
    const result = buildPaginationResponse(pendingPayments, total, page, limit);
    return success(res, result, 'Pending payments fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

/**
 * Create Razorpay order for user payment
 * POST /users/payments/razorpay/order
 */
exports.createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emiPaymentId } = req.body;

    if (!emiPaymentId) {
      return failure(res, 'EMI Payment ID is required', 400);
    }

    // Get admin ID from EMI payment
    const emiPayment = await EMIPayment.findById(emiPaymentId).populate({
      path: 'emiId',
      populate: {
        path: 'createdBy',
        select: '_id name email razorpayEnabled razorpayKeyId razorpayKeySecret'
      }
    });
    
    if (!emiPayment) {
      return failure(res, 'EMI payment not found', 404);
    }

    // Get admin from EMI's createdBy field
    const emi = emiPayment.emiId;
    if (!emi || !emi.createdBy) {
      return failure(res, 'EMI or admin information not found', 404);
    }

    // Handle both populated and non-populated createdBy
    const adminId = emi.createdBy._id || emi.createdBy;
    if (!adminId) {
      return failure(res, 'Admin ID not found for this EMI', 404);
    }

    const result = await paymentService.createRazorpayOrder(
      userId,
      emiPaymentId,
      adminId
    );

    return success(res, { data: result }, 'Razorpay order created');
  } catch (err) {
    console.error('Error creating Razorpay order:', err);
    return failure(res, err.message, 400);
  }
};

/**
 * Verify Razorpay payment
 * POST /users/payments/razorpay/verify
 */
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emiPaymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!emiPaymentId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return failure(res, 'All payment details are required', 400);
    }

    // Get admin ID from EMI payment
    const emiPayment = await EMIPayment.findById(emiPaymentId).populate({
      path: 'emiId',
      populate: {
        path: 'createdBy',
        select: '_id'
      }
    });
    
    if (!emiPayment) {
      return failure(res, 'EMI payment not found', 404);
    }

    // Get admin from EMI's createdBy field
    const emi = emiPayment.emiId;
    if (!emi || !emi.createdBy) {
      return failure(res, 'EMI or admin information not found', 404);
    }

    // Handle both populated and non-populated createdBy
    const adminId = emi.createdBy._id || emi.createdBy;
    if (!adminId) {
      return failure(res, 'Admin ID not found for this EMI', 404);
    }

    const result = await paymentService.verifyRazorpayPayment(
      userId,
      emiPaymentId,
      adminId,
      { razorpayOrderId, razorpayPaymentId, razorpaySignature }
    );

    return success(res, { data: result }, 'Payment verified and completed');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

/**
 * Get QR code for payment
 * GET /users/payments/qr/:emiPaymentId
 */
exports.getQRCode = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emiPaymentId } = req.params;

    // Get admin ID from EMI payment
    const emiPayment = await EMIPayment.findById(emiPaymentId).populate({
      path: 'emiId',
      populate: {
        path: 'createdBy',
        select: '_id'
      }
    });
    
    if (!emiPayment) {
      return failure(res, 'EMI payment not found', 404);
    }

    // Get admin from EMI's createdBy field
    const emi = emiPayment.emiId;
    if (!emi || !emi.createdBy) {
      return failure(res, 'EMI or admin information not found', 404);
    }

    // Handle both populated and non-populated createdBy
    const adminId = emi.createdBy._id || emi.createdBy;
    if (!adminId) {
      return failure(res, 'Admin ID not found for this EMI', 404);
    }

    const result = await paymentService.getQRCodePayment(
      userId,
      emiPaymentId,
      adminId
    );

    return success(res, { data: result }, 'QR code generated');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

/**
 * Submit QR code payment for verification
 * POST /users/payments/qr/verify
 */
exports.verifyQRCodePayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emiPaymentId, transactionId } = req.body;

    if (!emiPaymentId || !transactionId) {
      return failure(res, 'EMI Payment ID and Transaction ID are required', 400);
    }

    const result = await paymentService.verifyQRCodePayment(
      userId,
      emiPaymentId,
      transactionId
    );

    return success(res, { data: result }, 'QR code payment submitted for verification');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

/**
 * Submit bank transfer payment for verification
 * POST /users/payments/bank/verify
 */
exports.submitBankTransferPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emiPaymentId, transactionId } = req.body;

    if (!emiPaymentId || !transactionId) {
      return failure(res, 'EMI Payment ID and Transaction ID are required', 400);
    }

    const result = await paymentService.submitBankTransferPayment(
      userId,
      emiPaymentId,
      transactionId
    );

    return success(res, { data: result }, 'Bank transfer payment submitted for verification');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

