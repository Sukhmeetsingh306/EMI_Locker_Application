const { success, failure } = require('../../../core/response');
const emiPaymentTransactionService = require('../services/emiPaymentTransaction.service');

/**
 * Get pending EMI payment transactions for admin
 * GET /admins/emi-payment-transactions/pending
 */
exports.getPendingTransactions = async (req, res) => {
  try {
    const adminId = req.user.id;
    const result = await emiPaymentTransactionService.getPendingEmiPaymentTransactions(adminId, req.query);
    return success(res, result, 'Pending payment transactions fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

/**
 * Get all EMI payment transactions for admin (with filters)
 * GET /admins/emi-payment-transactions
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const adminId = req.user.id;
    const result = await emiPaymentTransactionService.getAllEmiPaymentTransactions(adminId, req.query);
    return success(res, result, 'Payment transactions fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

/**
 * Verify (approve) an EMI payment transaction
 * POST /admins/emi-payment-transactions/:transactionId/verify
 */
exports.verifyTransaction = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { transactionId } = req.params;
    const { notes } = req.body;

    const result = await emiPaymentTransactionService.verifyEmiPaymentTransaction(
      adminId,
      transactionId,
      notes
    );

    return success(res, { data: result }, 'Payment transaction verified successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

/**
 * Reject an EMI payment transaction
 * POST /admins/emi-payment-transactions/:transactionId/reject
 */
exports.rejectTransaction = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { transactionId } = req.params;
    const { notes } = req.body;

    const result = await emiPaymentTransactionService.rejectEmiPaymentTransaction(
      adminId,
      transactionId,
      notes
    );

    return success(res, { data: result }, 'Payment transaction rejected');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

