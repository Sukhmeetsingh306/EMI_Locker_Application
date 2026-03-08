const { success, failure } = require('../../../core/response');
const emiService = require('../services/emi.service');
const EMIPayment = require('../models/emi.payment.model');
const EMI = require('../models/emi.model');

const ensureOwnEmi = (emi, userId) => {
  if (!emi) return false;
  const ownerId = emi.user?._id ? emi.user._id.toString() : emi.user?.toString();
  return ownerId === userId.toString();
};

exports.createEmi = async (req, res) => {
  try {
    // Parse JSON string if req.body is a string
    let parsedBody = req.body;
    if (typeof req.body === 'string') {
      parsedBody = JSON.parse(req.body);
    }
    
    // Pass admin ID for key activation if needed
    const payload = { ...parsedBody, adminId: req.user.id };
    const emi = await emiService.createEmi(payload);
    return success(res, { data: emi }, 'EMI created successfully', 201);
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.listEmis = async (req, res) => {
  try {
    const adminId = req.user?.id || null;
    const adminRole = req.user?.role || null;
    const result = await emiService.listEmis(req.query, adminId, adminRole);
    return success(res, result, 'EMIs fetched successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.getEmi = async (req, res) => {
  try {
    const emi = await emiService.getEmiById(req.params.id);
    if (!emi) return failure(res, 'EMI not found', 404);

    // For admins (non-superadmin), check if they created this EMI
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    if (adminId && adminRole !== 'superadmin') {
      const emiCreatedBy = emi.createdBy?._id ? emi.createdBy._id.toString() : emi.createdBy?.toString();
      if (emiCreatedBy !== adminId.toString()) {
        return failure(res, 'You can only view EMIs you created', 403);
      }
    }

    return success(res, { data: emi }, 'EMI fetched successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.getEmiPayments = async (req, res) => {
  try {
    // For admins (non-superadmin), check if they created this EMI
    const adminId = req.user?.id;
    const adminRole = req.user?.role;
    if (adminId && adminRole !== 'superadmin') {
      const emi = await emiService.getEmiById(req.params.id);
      if (!emi) return failure(res, 'EMI not found', 404);
      
      const emiCreatedBy = emi.createdBy?._id ? emi.createdBy._id.toString() : emi.createdBy?.toString();
      if (emiCreatedBy !== adminId.toString()) {
        return failure(res, 'You can only view payments for EMIs you created', 403);
      }
    }

    const payments = await emiService.getEmiPayments(req.params.id);
    return success(res, { data: payments }, 'EMI payments fetched successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

// Client self-service - users can see ALL their EMIs from all admins
exports.listMyEmis = async (req, res) => {
  try {
    // Pass null for adminId and adminRole so it doesn't filter by createdBy
    // This allows users to see all their EMIs regardless of which admin created them
    const result = await emiService.listEmis({ ...req.query, userId: req.user.id }, null, null);
    return success(res, result, 'EMIs fetched successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.getMyEmi = async (req, res) => {
  try {
    const emi = await emiService.getEmiById(req.params.emiId);
    if (!ensureOwnEmi(emi, req.user.id)) return failure(res, 'EMI not found', 404);

    return success(res, { data: emi }, 'EMI fetched successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.getMyEmiPayments = async (req, res) => {
  try {
    const emi = await emiService.getEmiById(req.params.emiId);
    if (!ensureOwnEmi(emi, req.user.id)) return failure(res, 'EMI not found', 404);

    const payments = await emiService.getEmiPayments(req.params.emiId);
    return success(res, { data: payments }, 'EMI payments fetched successfully');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

