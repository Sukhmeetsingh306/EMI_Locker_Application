const { success, failure } = require('../../../core/response');
const keyPriceService = require('../services/keyPrice.service');

exports.getAllKeyPrices = async (req, res) => {
  try {
    const result = await keyPriceService.getAllKeyPrices(req.query);
    return success(res, result, 'Key prices fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.getActiveKeyPrices = async (req, res) => {
  try {
    const result = await keyPriceService.getActiveKeyPrices(req.query);
    return success(res, result, 'Active key prices fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.getKeyPriceById = async (req, res) => {
  try {
    const { id } = req.params;
    const keyPrice = await keyPriceService.getKeyPriceById(id);
    if (!keyPrice) return failure(res, 'Key price not found', 404);
    return success(res, { data: keyPrice }, 'Key price fetched');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.createKeyPrice = async (req, res) => {
  try {
    const keyPrice = await keyPriceService.createKeyPrice(req.body);
    return success(res, { data: keyPrice }, 'Key price created', 201);
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.updateKeyPrice = async (req, res) => {
  try {
    const { id } = req.params;
    const keyPrice = await keyPriceService.updateKeyPrice(id, req.body);
    return success(res, { data: keyPrice }, 'Key price updated');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

exports.deleteKeyPrice = async (req, res) => {
  try {
    const { id } = req.params;
    await keyPriceService.deleteKeyPrice(id);
    return success(res, {}, 'Key price deleted');
  } catch (err) {
    return failure(res, err.message, 400);
  }
};

