const KeyPrice = require('../models/keyPrice.model');
const { parsePagination, buildPaginationResponse, parseSort } = require('../../../utils/pagination');

exports.getAllKeyPrices = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, 'keys', 'asc');
  
  // Get total count
  const total = await KeyPrice.countDocuments({});
  
  // Get paginated data
  const keyPrices = await KeyPrice.find({})
    .sort(sort)
    .skip(skip)
    .limit(limit);
  
  return buildPaginationResponse(keyPrices, total, page, limit);
};

exports.getActiveKeyPrices = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, 'keys', 'asc');
  
  // Build filters
  const filters = { isActive: true };
  
  // Get total count
  const total = await KeyPrice.countDocuments(filters);
  
  // Get paginated data
  const keyPrices = await KeyPrice.find(filters)
    .sort(sort)
    .skip(skip)
    .limit(limit);
  
  return buildPaginationResponse(keyPrices, total, page, limit);
};

exports.getKeyPriceById = async (id) => {
  return KeyPrice.findById(id);
};

exports.createKeyPrice = async (payload) => {
  const { packageName, keys, price, description, isActive } = payload;

  // Check if keys count already exists
  const existing = await KeyPrice.findOne({ keys });
  if (existing) {
    throw new Error(`Package with ${keys} keys already exists`);
  }

  // Check if package name already exists
  const existingName = await KeyPrice.findOne({ packageName });
  if (existingName) {
    throw new Error(`Package name "${packageName}" already exists`);
  }

  return KeyPrice.create({
    packageName,
    keys,
    price,
    description,
    isActive: isActive !== undefined ? isActive : true
  });
};

exports.updateKeyPrice = async (id, payload) => {
  const { packageName, keys, price, description, isActive } = payload;

  const keyPrice = await KeyPrice.findById(id);
  if (!keyPrice) {
    throw new Error('Key price not found');
  }

  // If keys count is being changed, check for duplicates
  if (keys && keys !== keyPrice.keys) {
    const existing = await KeyPrice.findOne({ keys, _id: { $ne: id } });
    if (existing) {
      throw new Error(`Package with ${keys} keys already exists`);
    }
  }

  // If package name is being changed, check for duplicates
  if (packageName && packageName !== keyPrice.packageName) {
    const existingName = await KeyPrice.findOne({ packageName, _id: { $ne: id } });
    if (existingName) {
      throw new Error(`Package name "${packageName}" already exists`);
    }
  }

  if (packageName !== undefined) keyPrice.packageName = packageName;
  if (keys !== undefined) keyPrice.keys = keys;
  if (price !== undefined) keyPrice.price = price;
  if (description !== undefined) keyPrice.description = description;
  if (isActive !== undefined) keyPrice.isActive = isActive;

  await keyPrice.save();
  return keyPrice;
};

exports.deleteKeyPrice = async (id) => {
  const keyPrice = await KeyPrice.findByIdAndDelete(id);
  if (!keyPrice) {
    throw new Error('Key price not found');
  }
  return keyPrice;
};

