const { success, failure } = require('../../../core/response');
const paymentTransactionService = require('../services/paymentTransaction.service');
const Admin = require('../../admins/models/admin.model');

exports.createTransaction = async (req, res) => {
  try {
    const fromAdminId = req.user.id;
    const { toSuperAdminId, amount, paymentMethod, description } = req.body;

    if (!toSuperAdminId || !amount || !paymentMethod) {
      return failure(res, 'Super Admin ID, amount, and payment method are required', 400);
    }

    const transaction = await paymentTransactionService.createTransaction({
      fromAdminId,
      toSuperAdminId,
      amount,
      paymentMethod,
      description
    });

    return success(res, { data: transaction }, 'Transaction created', 201);
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.completeTransaction = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const paymentData = req.body;

    const transaction = await paymentTransactionService.completeTransaction(transactionId, paymentData);
    return success(res, { data: transaction }, 'Transaction completed');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.getAdminTransactions = async (req, res) => {
  try {
    const adminId = req.user.id;
    const result = await paymentTransactionService.getAdminTransactions(adminId, req.query);
    return success(res, result, 'Transactions fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.getAllTransactions = async (req, res) => {
  try {
    const { page, limit, skip } = require('../../../utils/pagination').parsePagination(req.query);
    const { parseSort } = require('../../../utils/pagination');
    
    console.log('getAllTransactions called with query:', req.query);
    
    // Check if this is for package payment transactions (based on query params)
    const isPackageTransaction = req.query.paymentMethod || req.query.adminId || req.query.agentId || req.query.paymentStatus;
    
    console.log('isPackageTransaction:', isPackageTransaction);
    
    if (isPackageTransaction) {
      // Handle PackagePaymentTransaction
      const PackagePaymentTransaction = require('../models/packagePaymentTransaction.model');
      
      // Build filters
      const filters = {};
      
      // Status filter (map paymentStatus to status)
      if (req.query.status || req.query.paymentStatus) {
        filters.status = req.query.status || req.query.paymentStatus;
      }
      
      // Payment method filter
      if (req.query.paymentMethod) {
        filters.paymentMethod = req.query.paymentMethod;
      }
      
      // Admin filter
      if (req.query.adminId) {
        filters.admin = req.query.adminId;
      }
      
      // Agent filter
      if (req.query.agentId) {
        filters.agent = req.query.agentId;
      }
      
      // Date range filters
      if (req.query.createdFrom) {
        filters.createdAt = { ...filters.createdAt, $gte: new Date(req.query.createdFrom) };
      }
      if (req.query.createdTo) {
        filters.createdAt = { ...filters.createdAt, $lte: new Date(req.query.createdTo) };
      }
      
      // Price filters
      if (req.query.priceMin) {
        filters.amount = { ...filters.amount, $gte: parseFloat(req.query.priceMin) };
      }
      if (req.query.priceMax) {
        filters.amount = { ...filters.amount, $lte: parseFloat(req.query.priceMax) };
      }
      
      console.log('PackageTransaction filters:', filters);
      
      // Get total count
      const total = await PackagePaymentTransaction.countDocuments(filters);
      
      // Get paginated data
      const sort = parseSort(req.query, 'createdAt', 'desc');
      const transactions = await PackagePaymentTransaction.find(filters)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('admin', 'name email mobile')
        .populate('keyPackage', 'packageName keys')
        .populate('keyPrice', 'packageName keys price')
        .lean();
      
      console.log('Found transactions:', transactions.length);
      
      const { buildPaginationResponse } = require('../../../utils/pagination');
      return success(res, buildPaginationResponse(transactions, total, page, limit), "Package payment transactions fetched");
    } else {
      // Handle original admin-to-superadmin transactions
      const result = await paymentTransactionService.getAllTransactions(req.query);
      return success(res, result, 'All transactions fetched');
    }
  } catch (err) {
    console.error('getAllTransactions error:', err);
    return failure(res, err.message, 400);
  }
};

