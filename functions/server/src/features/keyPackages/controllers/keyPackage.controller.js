const { success, failure } = require('../../../core/response');
const keyPackageService = require('../services/keyPackage.service');

exports.getPackageConfigs = async (req, res) => {
  try {
    const configs = await keyPackageService.getPackageConfigs();
    return success(res, { data: configs }, 'Package configurations fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.getAdminPackages = async (req, res) => {
  try {
    const adminId = req.user.id;
    const result = await keyPackageService.getAdminPackages(adminId, req.query);
    return success(res, result, 'Packages fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.getAllPackages = async (req, res) => {
  try {
    const result = await keyPackageService.getAllPackages(req.query);
    return success(res, result, 'All packages fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    const keyPackage = await keyPackageService.getPackageById(id);
    if (!keyPackage) return failure(res, 'Package not found', 404);
    return success(res, { data: keyPackage }, 'Package fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

