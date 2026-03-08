const KeyPackage = require('../models/keyPackage.model');
const KeyPrice = require('../../keyPrices/models/keyPrice.model');
const Admin = require('../../admins/models/admin.model');
const PackagePaymentTransaction = require('../../paymentTransactions/models/packagePaymentTransaction.model');
const { parsePagination, buildPaginationResponse, parseFilters, parseSort, buildSearchFilter } = require('../../../utils/pagination');

// Get package configurations from database
exports.getPackageConfigs = async () => {
  const keyPrices = await KeyPrice.find({ isActive: true }).sort({ keys: 1 });
  
  // Convert to the format expected by the frontend
  const configs = {};
  keyPrices.forEach(price => {
    configs[price.keys.toString()] = {
      keys: price.keys,
      price: price.price,
      packageName: price.packageName,
      id: price._id.toString()
    };
  });
  
  return configs;
};

exports.createPackagePurchase = async (payload) => {
  const { adminId, packageType, keyPriceId } = payload;

  // Resolve key price either by explicit id or legacy packageType (keys)
  const keyPriceQuery = keyPriceId
    ? { _id: keyPriceId, isActive: true }
    : { keys: parseInt(packageType), isActive: true };

  const keyPrice = await KeyPrice.findOne(keyPriceQuery);
  if (!keyPrice) {
    throw new Error('Invalid package type or package is inactive');
  }

  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new Error('Admin not found');
  }

  const keyPackage = await KeyPackage.create({
    admin: adminId,
    keyPrice: keyPrice._id,
    packageType: keyPrice.keys?.toString()
  });

  // Persist payment transaction separately - all packages use Razorpay
  const transaction = await PackagePaymentTransaction.create({
    admin: adminId,
    keyPackage: keyPackage._id,
    keyPrice: keyPrice._id,
    amount: keyPrice.price,
    paymentMethod: 'razorpay',
    status: 'pending'
  });

  return { keyPackage, transaction };
};

exports.completePackagePurchase = async (packageId, paymentData) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, transactionId } = paymentData;

  const keyPackage = await KeyPackage.findById(packageId).populate('keyPrice');
  if (!keyPackage) {
    throw new Error('Package not found');
  }

  const transaction = await PackagePaymentTransaction.findOne({ keyPackage: packageId }).sort({ createdAt: -1 });
  if (!transaction) {
    throw new Error('Payment transaction not found for this package');
  }

  if (transaction.status === 'completed') {
    throw new Error('Package already completed');
  }

  transaction.status = 'completed';
  if (razorpayOrderId) transaction.razorpayOrderId = razorpayOrderId;
  if (razorpayPaymentId) transaction.razorpayPaymentId = razorpayPaymentId;
  if (razorpaySignature) transaction.razorpaySignature = razorpaySignature;
  if (transactionId) transaction.transactionId = transactionId;

  await transaction.save();

  // Add keys to admin account
  const admin = await Admin.findById(keyPackage.admin);
  if (admin && keyPackage.keyPrice?.keys) {
    await admin.addKeys(keyPackage.keyPrice.keys);
  }

  return { keyPackage, transaction };
};

exports.getAdminPackages = async (adminId, query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, 'createdAt', 'desc');
  
  // Build filters
  const filters = { admin: adminId };
  
  // Date range filters
  if (query.createdFrom) {
    filters.createdAt = { ...filters.createdAt, $gte: new Date(query.createdFrom) };
  }
  if (query.createdTo) {
    filters.createdAt = { ...filters.createdAt, $lte: new Date(query.createdTo) };
  }
  
  // Get packages
  const packages = await KeyPackage.find(filters)
    .sort(sort)
    .populate('admin', 'name email')
    .populate('keyPrice')
    .lean();
  
  // Get package IDs
  const packageIds = packages.map(pkg => pkg._id);
  
  // Get transactions for these packages
  const transactions = await PackagePaymentTransaction.find({ 
    keyPackage: { $in: packageIds } 
  }).lean();
  
  // Create a map of packageId -> transaction data (prioritize cash over razorpay)
  const transactionMap = {};
  // Sort by creation date descending to ensure we get the latest transaction
  transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  transactions.forEach(txn => {
    const pkgId = txn.keyPackage.toString();
    // Only set if not already set, OR if current transaction is cash and existing is razorpay
    if (!transactionMap[pkgId] || (txn.paymentMethod === 'cash' && transactionMap[pkgId].paymentMethod === 'razorpay')) {
      transactionMap[pkgId] = {
        status: txn.status,
        paymentMethod: txn.paymentMethod
      };
    }
  });
  
  // Add status, paymentStatus, and other fields to each package
  let packagesWithStatus = packages.map(pkg => {
    const txn = transactionMap[pkg._id.toString()];
    return {
      ...pkg,
      status: txn?.status || 'pending',
      paymentStatus: txn?.status || 'pending', // Add paymentStatus for frontend compatibility
      paymentMethod: txn?.paymentMethod || null,
      // Flatten keyPrice fields for easier frontend access
      keys: pkg.keyPrice?.keys || 0,
      price: pkg.keyPrice?.price || 0,
      packageName: pkg.keyPrice?.packageName || pkg.packageType || 'N/A'
    };
  });
  
  // Filter by paymentStatus if provided
  if (query.paymentStatus) {
    packagesWithStatus = packagesWithStatus.filter(pkg => pkg.paymentStatus === query.paymentStatus);
  }
  
  // Get total after filtering
  const total = packagesWithStatus.length;
  
  // Apply pagination
  const paginatedPackages = packagesWithStatus.slice(skip, skip + limit);
  
  return buildPaginationResponse(paginatedPackages, total, page, limit);
};

exports.getAllPackages = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, 'createdAt', 'desc');
  
  // Build filters
  const filters = {};
  
  // Admin filter
  if (query.adminId) {
    filters.admin = query.adminId;
  }
  
  // Package type filter
  if (query.packageType) {
    filters.packageType = query.packageType;
  }
  
  // Date range filters
  if (query.createdFrom) {
    filters.createdAt = { ...filters.createdAt, $gte: new Date(query.createdFrom) };
  }
  if (query.createdTo) {
    filters.createdAt = { ...filters.createdAt, $lte: new Date(query.createdTo) };
  }
  
  // Search filter - search in admin name, email, or mobile
  let adminSearchFilter = {};
  if (query.search) {
    const searchRegex = { $regex: query.search, $options: 'i' };
    adminSearchFilter = {
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex }
      ]
    };
  }
  
  // Get packages
  const packages = await KeyPackage.find(filters)
    .sort(sort)
    .populate({
      path: 'admin',
      select: 'name email mobile',
      match: Object.keys(adminSearchFilter).length > 0 ? adminSearchFilter : undefined
    })
    .populate('keyPrice')
    .lean();
  
  // Filter out packages where admin doesn't match search (if search is provided)
  let filteredPackages = packages;
  if (query.search) {
    filteredPackages = packages.filter(pkg => pkg.admin !== null);
  }
  
  // Get package IDs
  const packageIds = filteredPackages.map(pkg => pkg._id);
  
  // Get transactions for these packages
  const transactions = await PackagePaymentTransaction.find({ 
    keyPackage: { $in: packageIds } 
  }).lean();
  
  // Create a map of packageId -> transaction data (prioritize cash over razorpay)
  const transactionMap = {};
  // Sort by creation date descending to ensure we get the latest transaction
  transactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  transactions.forEach(txn => {
    const pkgId = txn.keyPackage.toString();
    // Only set if not already set, OR if current transaction is cash and existing is razorpay
    if (!transactionMap[pkgId] || (txn.paymentMethod === 'cash' && transactionMap[pkgId].paymentMethod === 'razorpay')) {
      transactionMap[pkgId] = {
        status: txn.status,
        paymentMethod: txn.paymentMethod
      };
    }
  });
  
  // Add status, paymentStatus, and other fields to each package
  let packagesWithStatus = filteredPackages.map(pkg => {
    const txn = transactionMap[pkg._id.toString()];
    return {
      ...pkg,
      status: txn?.status || 'pending',
      paymentStatus: txn?.status || 'pending', // Add paymentStatus for frontend compatibility
      paymentMethod: txn?.paymentMethod || null,
      // Flatten keyPrice fields for easier frontend access
      keys: pkg.keyPrice?.keys || 0,
      price: pkg.keyPrice?.price || 0,
      packageName: pkg.keyPrice?.packageName || pkg.packageType || 'N/A'
    };
  });
  
  // Filter by paymentStatus if provided
  if (query.paymentStatus) {
    packagesWithStatus = packagesWithStatus.filter(pkg => pkg.paymentStatus === query.paymentStatus);
  }
  
  // Get total after filtering
  const total = packagesWithStatus.length;
  
  // Apply pagination
  const paginatedPackages = packagesWithStatus.slice(skip, skip + limit);
  
  return buildPaginationResponse(paginatedPackages, total, page, limit);
};

exports.getPackageById = async (packageId) => {
  return KeyPackage.findById(packageId)
    .populate('admin', 'name email')
    .populate('keyPrice');
};

