const EmiPaymentTransaction = require('../models/emiPaymentTransaction.model');
const EMIPayment = require('../../emi/models/emi.payment.model');
const EMI = require('../../emi/models/emi.model');
const ClientUser = require('../../users/models/user.model');
const UserDevice = require('../../users/models/userDevice.model');
const { parsePagination, buildPaginationResponse, parseSort } = require('../../../utils/pagination');

/**
 * Get pending EMI payment transactions for admin
 * @param {String} adminId - Admin ID
 * @param {Object} query - Query parameters (pagination, filters)
 * @returns {Promise<Object>} Paginated pending transactions
 */
const getPendingEmiPaymentTransactions = async (adminId, query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, 'createdAt', 'desc');

  // Build filters - only pending transactions for QR code and bank transfers
  const filters = {
    admin: adminId,
    status: 'pending',
    paymentMethod: { $in: ['qr_code', 'bank_transfer'] }
  };

  // Payment method filter (optional)
  if (query.paymentMethod) {
    filters.paymentMethod = query.paymentMethod;
  }

  // Date range filters
  if (query.createdFrom) {
    filters.createdAt = { ...filters.createdAt, $gte: new Date(query.createdFrom) };
  }
  if (query.createdTo) {
    filters.createdAt = { ...filters.createdAt, $lte: new Date(query.createdTo) };
  }

  // Build search filter
  if (query.search && query.search.trim()) {
    const searchRegex = { $regex: query.search.trim(), $options: 'i' };
    
    // Search in user name, phone, email
    const matchingUsers = await ClientUser.find({
      createdBy: adminId,
      $or: [
        { fullName: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex }
      ]
    }).select('_id').lean();
    const matchingUserIds = matchingUsers.map(u => u._id);

    // Search in EMI bill number
    const matchingEmis = await EMI.find({
      createdBy: adminId,
      billNumber: searchRegex
    }).select('_id').lean();
    const matchingEmiIds = matchingEmis.map(e => e._id);

    // Search in transaction ID (direct field search)
    const searchRegexTransactionId = { $regex: query.search.trim(), $options: 'i' };

    // Build $or conditions for search
    const searchOrConditions = [];
    if (matchingUserIds.length > 0) {
      searchOrConditions.push({ user: { $in: matchingUserIds } });
    }
    if (matchingEmiIds.length > 0) {
      searchOrConditions.push({ emi: { $in: matchingEmiIds } });
    }
    // Always include transactionId search (it's a direct field)
    searchOrConditions.push({ transactionId: searchRegexTransactionId });

    // Combine existing filters with search using $and
    if (searchOrConditions.length > 0) {
      const baseFilters = { ...filters };
      filters = {
        $and: [
          baseFilters,
          { $or: searchOrConditions }
        ]
      };
    } else {
      // No matches found, return empty results
      filters._id = { $in: [] };
    }
  }

  // Get total count
  const total = await EmiPaymentTransaction.countDocuments(filters);

  // Get paginated data with populated fields
  const transactions = await EmiPaymentTransaction.find(filters)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('user', 'fullName email mobile')
    .populate('emi', 'billNumber totalAmount description')
    .populate('emiPayment', 'installmentNumber amount dueDate')
    .populate('admin', 'name email');

  return buildPaginationResponse(transactions, total, page, limit);
};

/**
 * Verify (approve) an EMI payment transaction
 * @param {String} adminId - Admin ID who is verifying
 * @param {String} transactionId - Transaction ID to verify
 * @param {String} notes - Optional notes
 * @returns {Promise<Object>} Updated transaction and payment details
 */
const verifyEmiPaymentTransaction = async (adminId, transactionId, notes = null) => {
  // Get the transaction
  const transaction = await EmiPaymentTransaction.findById(transactionId)
    .populate('emiPayment')
    .populate('emi')
    .populate('user');

  if (!transaction) {
    throw new Error('Payment transaction not found');
  }

  // Verify that the transaction belongs to this admin
  if (transaction.admin.toString() !== adminId) {
    throw new Error('Unauthorized: You can only verify payments for your own transactions');
  }

  // Check if transaction is already processed
  if (transaction.status !== 'pending') {
    throw new Error(`Transaction is already ${transaction.status}`);
  }

  // Get EMI payment
  const emiPayment = await EMIPayment.findById(transaction.emiPayment);
  if (!emiPayment) {
    throw new Error('EMI payment not found');
  }

  // Check if payment is already paid
  if (emiPayment.status === 'paid') {
    throw new Error('This installment is already paid');
  }

  // Update transaction status to completed
  transaction.status = 'completed';
  if (notes) {
    transaction.notes = notes;
  }
  await transaction.save();

  // Mark EMI payment as paid
  emiPayment.status = 'paid';
  emiPayment.paidDate = new Date();
  await emiPayment.save();

  // Update EMI
  const emi = await EMI.findById(transaction.emi);
  if (!emi) {
    throw new Error('EMI not found');
  }

  emi.paidInstallments += 1;

  // Check if all payments are completed
  if (emi.paidInstallments >= emi.totalInstallments) {
    emi.status = 'completed';

    // Get user ID - handle both populated and unpopulated cases
    const userId = emi.user?._id ? emi.user._id.toString() : (emi.user?.toString() || transaction.user._id.toString());
    const remainingActive = await EMI.countDocuments({
      user: userId,
      status: 'active',
      _id: { $ne: emi._id }
    });

    // If no remaining active EMIs, unlock the device
    if (remainingActive === 0) {
      await UserDevice.findOneAndUpdate(
        { userId },
        { deviceLocked: false },
        { upsert: true, new: true }
      );
    }
  }

  await emi.save();

  return {
    transaction,
    emiPayment,
    emi
  };
};

/**
 * Reject an EMI payment transaction
 * @param {String} adminId - Admin ID who is rejecting
 * @param {String} transactionId - Transaction ID to reject
 * @param {String} notes - Optional rejection reason/notes
 * @returns {Promise<Object>} Updated transaction
 */
const rejectEmiPaymentTransaction = async (adminId, transactionId, notes = null) => {
  // Get the transaction
  const transaction = await EmiPaymentTransaction.findById(transactionId);

  if (!transaction) {
    throw new Error('Payment transaction not found');
  }

  // Verify that the transaction belongs to this admin
  if (transaction.admin.toString() !== adminId) {
    throw new Error('Unauthorized: You can only reject payments for your own transactions');
  }

  // Check if transaction is already processed
  if (transaction.status !== 'pending') {
    throw new Error(`Transaction is already ${transaction.status}`);
  }

  // Update transaction status to failed
  transaction.status = 'failed';
  if (notes) {
    transaction.notes = notes;
  }
  await transaction.save();

  return { transaction };
};

/**
 * Get all EMI payment transactions for admin (with filters)
 * @param {String} adminId - Admin ID
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Paginated transactions
 */
const getAllEmiPaymentTransactions = async (adminId, query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, 'createdAt', 'desc');

  // Build filters
  const filters = {
    admin: adminId
  };

  // Status filter
  if (query.status) {
    filters.status = query.status;
  }

  // Payment method filter
  if (query.paymentMethod) {
    filters.paymentMethod = query.paymentMethod;
  }

  // Date range filters
  if (query.createdFrom) {
    filters.createdAt = { ...filters.createdAt, $gte: new Date(query.createdFrom) };
  }
  if (query.createdTo) {
    filters.createdAt = { ...filters.createdAt, $lte: new Date(query.createdTo) };
  }

  // Get total count
  const total = await EmiPaymentTransaction.countDocuments(filters);

  // Get paginated data with populated fields
  const transactions = await EmiPaymentTransaction.find(filters)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('user', 'fullName email mobile')
    .populate('emi', 'billNumber totalAmount description')
    .populate('emiPayment', 'installmentNumber amount dueDate status')
    .populate('admin', 'name email');

  return buildPaginationResponse(transactions, total, page, limit);
};

module.exports = {
  getPendingEmiPaymentTransactions,
  verifyEmiPaymentTransaction,
  rejectEmiPaymentTransaction,
  getAllEmiPaymentTransactions
};

