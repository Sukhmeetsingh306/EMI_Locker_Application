const { success, failure } = require('../../../core/response');
const paymentConfigService = require('../services/paymentConfig.service');

exports.updatePaymentConfig = async (req, res) => {
  try {
    const adminId = req.user.id;
    const config = req.body;

    const updatedAdmin = await paymentConfigService.updatePaymentConfig(adminId, config);
    return success(res, { data: updatedAdmin }, 'Payment configuration updated');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.getPaymentConfig = async (req, res) => {
  try {
    const adminId = req.user.id;
    const config = await paymentConfigService.getPaymentConfig(adminId);
    return success(res, { data: config }, 'Payment configuration fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// Get all admins' payment configs (superadmin only)
exports.getAllAdminsPaymentConfig = async (req, res) => {
  try {
    const configs = await paymentConfigService.getAllAdminsPaymentConfig();
    return success(res, { data: configs }, 'All admins payment configs fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// Get payment config for a specific admin (superadmin only)
exports.getAdminPaymentConfig = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    const config = await paymentConfigService.getPaymentConfig(adminId);
    return success(res, { data: config }, 'Admin payment config fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// Update payment config for a specific admin (superadmin only)
exports.updateAdminPaymentConfig = async (req, res) => {
  try {
    const adminId = req.params.adminId;
    const config = req.body;

    const updatedAdmin = await paymentConfigService.updatePaymentConfig(adminId, config);
    return success(res, { data: updatedAdmin }, 'Admin payment configuration updated');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

