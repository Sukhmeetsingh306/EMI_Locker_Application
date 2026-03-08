const PaymentTransaction = require('../models/paymentTransaction.model');
const Admin = require('../../admins/models/admin.model');
const { parsePagination, buildPaginationResponse, parseFilters, parseSort, buildSearchFilter } = require('../../../utils/pagination');

exports.createTransaction = async (payload) => {
  const { fromAdminId, toSuperAdminId, amount, paymentMethod, description } = payload;

  // Verify both admins exist
  const fromAdmin = await Admin.findById(fromAdminId);
  const toSuperAdmin = await Admin.findById(toSuperAdminId);

  if (!fromAdmin || !toSuperAdmin) {
    throw new Error('Admin or Super Admin not found');
  }

  if (toSuperAdmin.role !== 'superadmin') {
    throw new Error('Target must be a superadmin');
  }

  const transaction = await PaymentTransaction.create({
    fromAdmin: fromAdminId,
    toSuperAdmin: toSuperAdminId,
    amount,
    paymentMethod,
    description,
    status: 'pending'
  });

  return transaction;
};

exports.completeTransaction = async (transactionId, paymentData) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, transactionId: txId } = paymentData;

  const transaction = await PaymentTransaction.findById(transactionId);
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.status === 'completed') {
    throw new Error('Transaction already completed');
  }

  transaction.status = 'completed';
  if (razorpayOrderId) transaction.razorpayOrderId = razorpayOrderId;
  if (razorpayPaymentId) transaction.razorpayPaymentId = razorpayPaymentId;
  if (razorpaySignature) transaction.razorpaySignature = razorpaySignature;
  if (txId) transaction.transactionId = txId;

  await transaction.save();
  return transaction;
};

exports.getAdminTransactions = async (adminId, query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, 'createdAt', 'desc');
  
  // Build filters
  const filters = {
    $or: [{ fromAdmin: adminId }, { toSuperAdmin: adminId }]
  };
  
  // Status filter
  if (query.status) {
    filters.status = query.status;
  }
  
  // Payment method filter
  if (query.paymentMethod) {
    filters.paymentMethod = query.paymentMethod;
  }
  
  // Amount range filters
  if (query.amountMin) {
    filters.amount = { ...filters.amount, $gte: parseFloat(query.amountMin) };
  }
  if (query.amountMax) {
    filters.amount = { ...filters.amount, $lt: parseFloat(query.amountMax) };
  }
  
  // Date range filters
  if (query.createdFrom) {
    filters.createdAt = { ...filters.createdAt, $gte: new Date(query.createdFrom) };
  }
  if (query.createdTo) {
    filters.createdAt = { ...filters.createdAt, $lte: new Date(query.createdTo) };
  }
  
  // Get total count
  const total = await PaymentTransaction.countDocuments(filters);
  
  // Get paginated data
  const transactions = await PaymentTransaction.find(filters)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('fromAdmin', 'name email')
    .populate('toSuperAdmin', 'name email');
  
  return buildPaginationResponse(transactions, total, page, limit);
};

exports.getAllTransactions = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, 'createdAt', 'desc');
  
  // Build filters
  const filters = {};
  
  // Admin filter
  if (query.fromAdminId) {
    filters.fromAdmin = query.fromAdminId;
  }
  if (query.toSuperAdminId) {
    filters.toSuperAdmin = query.toSuperAdminId;
  }
  
  // Status filter
  if (query.status) {
    filters.status = query.status;
  }
  
  // Payment method filter
  if (query.paymentMethod) {
    filters.paymentMethod = query.paymentMethod;
  }
  
  // Amount range filters
  if (query.amountMin) {
    filters.amount = { ...filters.amount, $gte: parseFloat(query.amountMin) };
  }
  if (query.amountMax) {
    filters.amount = { ...filters.amount, $lt: parseFloat(query.amountMax) };
  }
  
  // Date range filters
  if (query.createdFrom) {
    filters.createdAt = { ...filters.createdAt, $gte: new Date(query.createdFrom) };
  }
  if (query.createdTo) {
    filters.createdAt = { ...filters.createdAt, $lte: new Date(query.createdTo) };
  }
  
  // Get total count
  const total = await PaymentTransaction.countDocuments(filters);
  
  // Get paginated data
  const transactions = await PaymentTransaction.find(filters)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('fromAdmin', 'name email')
    .populate('toSuperAdmin', 'name email');
  
  return buildPaginationResponse(transactions, total, page, limit);
};

