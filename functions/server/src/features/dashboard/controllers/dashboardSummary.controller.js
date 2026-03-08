const { success, failure } = require('../../../core/response');
const dashboardSummaryService = require('../services/dashboardSummary.service');

// Lightweight dashboard summary - only counts
exports.getDashboardSummary = async (req, res) => {
  try {
    const summary = await dashboardSummaryService.getDashboardSummary();
    return success(res, { data: summary }, 'Dashboard summary fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// Lightweight admin list for dashboard
// Get admin-specific dashboard stats
exports.getAdminDashboardStats = async (req, res) => {
  try {
    const adminId = req.user.id; // Get from authenticated user
    const stats = await dashboardSummaryService.getAdminDashboardStats(adminId);
    return success(res, { data: stats }, 'Admin dashboard stats fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// Get total pending payments till today (standalone endpoint)
exports.getTotalPendingPayments = async (req, res) => {
  try {
    const adminId = req.user.id; // Get from authenticated user
    const stats = await dashboardSummaryService.getTotalPendingPayments(adminId);
    return success(res, { data: stats }, 'Total pending payments fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

