const { success, failure } = require('../../../core/response');
const paymentsTodayService = require('../services/paymentsToday.service');

/**
 * Get payments today for admin
 * GET /dashboard-stats/payments-today
 */
exports.getPaymentsToday = async (req, res) => {
  try {
    const adminId = req.user.id;
    const result = await paymentsTodayService.getPaymentsToday(adminId, req.query);
    return success(res, result, 'Payments today fetched successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

