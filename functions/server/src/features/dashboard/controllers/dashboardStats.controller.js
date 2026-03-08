const { success, failure } = require('../../../core/response');
const dashboardStatsService = require('../services/dashboardStats.service');

exports.getAdminDetailedStats = async (req, res) => {
  try {
    const { adminId } = req.params;
    const stats = await dashboardStatsService.getAdminDetailedStats(adminId);
    return success(res, { data: stats }, 'Admin detailed stats fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

