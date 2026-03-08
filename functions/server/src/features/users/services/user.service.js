// const { StatusCodes } = require('http-status-codes');
// const ApiError = require('../../../core/ApiError');
// const User = require('../models/user.model');

// const formatUser = (userDoc) => {
//   if (!userDoc) return null;
//   const userObject = userDoc.toObject ? userDoc.toObject() : userDoc;
//   delete userObject.password;
//   delete userObject.__v;
//   return userObject;
// };

// const createUser = async (payload) => {
//   const existingUser = await User.findOne({ email: payload.email });
//   if (existingUser) {
//     throw new ApiError(StatusCodes.CONFLICT, 'Email already registered');
//   }

//   const user = await User.create(payload);
//   return formatUser(user);
// };

// const getUserByEmail = (email, { includePassword = false } = {}) => {
//   const query = User.findOne({ email });
//   if (includePassword) {
//     query.select('+password');
//   }
//   return query;
// };

// const getUserById = async (id) => {
//   const user = await User.findById(id);
//   return formatUser(user);
// };

// module.exports = {
//   createUser,
//   getUserByEmail,
//   getUserById,
//   formatUser,
// };



//////////////////////////////


const ClientUser = require('../models/user.model');
const UserKey = require('../models/userKey.model');
const UserDevice = require('../models/userDevice.model');
const EMI = require('../../emi/models/emi.model');
const Admin = require('../../admins/models/admin.model');
const mongoose = require('mongoose');
const { generateUniqueUserKey } = require('../../../utils/keyGenerator');
const { parsePagination, buildPaginationResponse, parseFilters, parseSort, buildSearchFilter } = require('../../../utils/pagination');
const logger = require('../../../config/logger');

const createUser = async (payload, adminId) => {
  // Check if admin exists
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new Error('Admin not found');
  }

  // Check for duplicates within the same admin
  const duplicateChecks = [];
  
  if (payload.mobile) {
    const existingMobile = await ClientUser.findOne({ 
      createdBy: adminId, 
      mobile: payload.mobile 
    });
    if (existingMobile) {
      duplicateChecks.push('Mobile number already exists under this admin');
    }
  }
  
  if (payload.email) {
    const existingEmail = await ClientUser.findOne({ 
      createdBy: adminId, 
      email: payload.email 
    });
    if (existingEmail) {
      duplicateChecks.push('Email already exists under this admin');
    }
  }
  
  if (payload.aadhar) {
    const existingAadhar = await ClientUser.findOne({ 
      createdBy: adminId, 
      aadhar: payload.aadhar 
    });
    if (existingAadhar) {
      duplicateChecks.push('Aadhar already exists under this admin');
    }
  }
  
  if (payload.pan) {
    const existingPan = await ClientUser.findOne({ 
      createdBy: adminId, 
      pan: payload.pan 
    });
    if (existingPan) {
      duplicateChecks.push('PAN already exists under this admin');
    }
  }
  
  if (duplicateChecks.length > 0) {
    throw new Error(duplicateChecks.join(', '));
  }

  // Create user
  const user = await ClientUser.create({
    ...payload,
    createdBy: adminId,
  });

  // Note: Key will be auto-assigned and activated on first EMI creation

  // Create user device record
  await UserDevice.create({
    userId: user._id,
    deviceId: payload.deviceId || null,
    deviceLocked: false,
  });

  // Populate related data for response
  const populatedUser = await ClientUser.findById(user._id)
    .populate('createdBy', 'name email');
  
  const userKeyDoc = await UserKey.findOne({ userId: user._id })
    .populate('keyAssignedBy', 'name email');
  const userDeviceDoc = await UserDevice.findOne({ userId: user._id });

  // Attach key and device info to user object
  const userObj = populatedUser.toObject();
  if (userKeyDoc) {
    userObj.userKey = userKeyDoc.userKey;
    userObj.keyAssignedBy = userKeyDoc.keyAssignedBy;
    userObj.keyAssignedAt = userKeyDoc.keyAssignedAt;
    userObj.keyExpiryDate = userKeyDoc.keyExpiryDate;
    userObj.isKeyExpired = userKeyDoc.isKeyExpired;
    userObj.isKeyActive = userKeyDoc.isKeyActive;
  }
  if (userDeviceDoc) {
    userObj.deviceId = userDeviceDoc.deviceId;
    userObj.deviceLocked = userDeviceDoc.deviceLocked;
  }

  return userObj;
};

const deleteUser = async (id) => {
  // Optional: also check EMIs etc.
  await EMI.deleteMany({ user: id });
  // Delete related key and device records
  await UserKey.deleteOne({ userId: id });
  await UserDevice.deleteOne({ userId: id });
  const user = await ClientUser.findByIdAndDelete(id);
  return user;
};

const getUserById = async (id) => {
  const user = await ClientUser.findById(id).populate('createdBy', 'name email');
  if (!user) return null;

  const userKey = await UserKey.findOne({ userId: id }).populate('keyAssignedBy', 'name email');
  const userDevice = await UserDevice.findOne({ userId: id });

  const userObj = user.toObject();
  if (userKey) {
    userObj.userKey = userKey.userKey;
    userObj.keyAssignedBy = userKey.keyAssignedBy;
    userObj.keyAssignedAt = userKey.keyAssignedAt;
    userObj.keyExpiryDate = userKey.keyExpiryDate;
    userObj.isKeyExpired = userKey.isKeyExpired;
    userObj.isKeyActive = userKey.isKeyActive;
  }
  if (userDevice) {
    userObj.deviceId = userDevice.deviceId;
    userObj.deviceLocked = userDevice.deviceLocked;
  }

  return userObj;
};

const listUsers = async (query = {}, adminId = null, adminRole = null) => {
  const { page, limit, skip } = parsePagination(query);
  const sortField = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  
  // Build base filters for users
  const matchFilters = {};
  
  // Filter by admin if not superadmin, or if createdBy query param is provided (for superadmins)
  if (query.createdBy) {
    // Allow superadmins to filter by specific admin via query parameter
    matchFilters.createdBy = new mongoose.Types.ObjectId(query.createdBy);
  } else if (adminId && adminRole !== 'superadmin') {
    // Regular admins can only see their own users
    matchFilters.createdBy = new mongoose.Types.ObjectId(adminId);
  }
  
  // Search filter - search in user fields
  if (query.search) {
    const searchRegex = { $regex: query.search, $options: 'i' };
    matchFilters.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { mobile: searchRegex }
    ];
  }
  
  // Date range filters
  if (query.createdFrom) {
    matchFilters.createdAt = { ...matchFilters.createdAt, $gte: new Date(query.createdFrom) };
  }
  if (query.createdTo) {
    matchFilters.createdAt = { ...matchFilters.createdAt, $lte: new Date(query.createdTo) };
  }
  
  // Build aggregation pipeline
  const pipeline = [
    // Match users based on filters
    { $match: matchFilters },
    
    // Lookup EMIs to count them
    {
      $lookup: {
        from: 'emis',
        localField: '_id',
        foreignField: 'user',
        as: 'emis'
      }
    },
    
    // Add EMI count field
    {
      $addFields: {
        emiCount: { $size: '$emis' }
      }
    },
    
    // Filter by EMI count if provided
    ...(query.emiCountMin || query.emiCountMax ? [{
      $match: {
        emiCount: {
          ...(query.emiCountMin ? { $gte: parseInt(query.emiCountMin) } : {}),
          ...(query.emiCountMax ? { $lt: parseInt(query.emiCountMax) } : {})
        }
      }
    }] : []),
    
    // Lookup user keys
    {
      $lookup: {
        from: 'userkeys',
        localField: '_id',
        foreignField: 'userId',
        as: 'userKeyDoc'
      }
    },
    
    // Lookup user devices
    {
      $lookup: {
        from: 'userdevices',
        localField: '_id',
        foreignField: 'userId',
        as: 'userDeviceDoc'
      }
    },
    
    // Unwind key and device (they should be single documents)
    {
      $unwind: {
        path: '$userKeyDoc',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $unwind: {
        path: '$userDeviceDoc',
        preserveNullAndEmptyArrays: true
      }
    },
    
    // Apply key filters
    ...(query.keyStatus ? (() => {
      const now = new Date();
      let keyMatch = {};
      if (query.keyStatus === 'active') {
        keyMatch = {
          'userKeyDoc.isExpired': false,
          'userKeyDoc.keyExpiryDate': { $exists: true, $ne: null, $gte: now }
        };
      } else if (query.keyStatus === 'expired') {
        keyMatch = {
          $or: [
            { 'userKeyDoc.isExpired': true },
            { 'userKeyDoc.keyExpiryDate': { $exists: true, $ne: null, $lt: now } }
          ]
        };
      } else if (query.keyStatus === 'inactive') {
        keyMatch = {
          $or: [
            { 'userKeyDoc.keyExpiryDate': { $exists: false } },
            { 'userKeyDoc.keyExpiryDate': null }
          ]
        };
      }
      return Object.keys(keyMatch).length > 0 ? [{ $match: keyMatch }] : [];
    })() : []),
    
    // Apply device filter
    ...(query.deviceLocked !== undefined ? [{
      $match: {
        'userDeviceDoc.deviceLocked': query.deviceLocked === 'true' || query.deviceLocked === true
      }
    }] : []),
    
    // Apply hasKey filter
    ...(query.hasKey !== undefined ? [{
      $match: query.hasKey === 'true' || query.hasKey === true 
        ? { 'userKeyDoc': { $exists: true, $ne: null } }
        : { $or: [{ 'userKeyDoc': { $exists: false } }, { 'userKeyDoc': null }] }
    }] : []),
    
    // Sort
    {
      $sort: {
        [sortField === 'emiCount' ? 'emiCount' : sortField]: sortOrder
      }
    },
    
    // Get total count before pagination
    {
      $facet: {
        totalCount: [{ $count: 'count' }],
        data: [
          { $skip: skip },
          { $limit: limit },
          // Populate createdBy
          {
            $lookup: {
              from: 'admins',
              localField: 'createdBy',
              foreignField: '_id',
              as: 'createdByDoc'
            }
          },
          {
            $unwind: {
              path: '$createdByDoc',
              preserveNullAndEmptyArrays: true
            }
          },
          // Populate keyAssignedBy
          {
            $lookup: {
              from: 'admins',
              localField: 'userKeyDoc.keyAssignedBy',
              foreignField: '_id',
              as: 'keyAssignedByDoc'
            }
          },
          {
            $unwind: {
              path: '$keyAssignedByDoc',
              preserveNullAndEmptyArrays: true
            }
          },
          // Project final structure
          {
            $project: {
              _id: 1,
              fullName: 1,
              name: 1,
              email: 1,
              mobile: 1,
              aadhar: 1,
              pan: 1,
              createdAt: 1,
              updatedAt: 1,
              createdBy: {
                _id: '$createdByDoc._id',
                name: '$createdByDoc.name',
                email: '$createdByDoc.email'
              },
              userKey: '$userKeyDoc.userKey',
              keyAssignedBy: {
                _id: '$keyAssignedByDoc._id',
                name: '$keyAssignedByDoc.name',
                email: '$keyAssignedByDoc.email'
              },
              keyAssignedAt: '$userKeyDoc.keyAssignedAt',
              keyExpiryDate: '$userKeyDoc.keyExpiryDate',
              isKeyExpired: '$userKeyDoc.isExpired',
              isKeyActive: '$userKeyDoc.isKeyActive',
              deviceId: '$userDeviceDoc.deviceId',
              deviceLocked: '$userDeviceDoc.deviceLocked',
              emiCount: 1
            }
          }
        ]
      }
    }
  ];
  
  const result = await ClientUser.aggregate(pipeline);
  const total = result[0]?.totalCount[0]?.count || 0;
  const users = result[0]?.data || [];
  
  // Get key status counts - filter by admin if not superadmin
  let keyStatsFilter = {};
  if (adminId && adminRole !== 'superadmin') {
    const adminUserIds = await ClientUser.find({ createdBy: adminId }).select('_id').lean();
    const adminUserIdArray = adminUserIds.map(u => u._id);
    keyStatsFilter.userId = { $in: adminUserIdArray };
  }
  
  const now = new Date();
  const activeKeysCount = await UserKey.countDocuments({
    ...keyStatsFilter,
    isExpired: false,
    keyExpiryDate: { $exists: true, $ne: null, $gte: now }
  });

  const expiredKeysCount = await UserKey.countDocuments({
    ...keyStatsFilter,
    $or: [
      { isExpired: true },
      { keyExpiryDate: { $exists: true, $ne: null, $lt: now } }
    ]
  });

  const inactiveKeysCount = await UserKey.countDocuments({
    ...keyStatsFilter,
    $or: [
      { keyExpiryDate: { $exists: false } },
      { keyExpiryDate: null }
    ]
  });

  const totalUsers = adminId && adminRole !== 'superadmin' 
    ? await ClientUser.countDocuments({ createdBy: adminId })
    : await ClientUser.countDocuments({});
  const totalKeys = adminId && adminRole !== 'superadmin'
    ? await UserKey.countDocuments(keyStatsFilter)
    : await UserKey.countDocuments({});
  const noKeyCount = totalUsers - totalKeys;

  const response = buildPaginationResponse(users, total, page, limit);
  response.keyStats = {
    active: activeKeysCount,
    expired: expiredKeysCount,
    inactive: inactiveKeysCount,
    noKey: noKeyCount,
    total: activeKeysCount + expiredKeysCount + inactiveKeysCount + noKeyCount
  };
  
  return response;
};


/**
 * Activate or renew a key for a user
 * @param {String} userId - User ID
 * @param {String} adminId - Admin ID who is activating/renewing the key
 * @returns {Promise<Object>} Updated user object
 */
const activateOrRenewKey = async (userId, adminId) => {
  // Check if admin has available keys
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new Error('Admin not found');
  }

  if (admin.availableKeys <= 0) {
    throw new Error('No available keys. Please purchase a key package.');
  }

  // Check if user exists
  const user = await ClientUser.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Check if user has a key
  let userKey = await UserKey.findOne({ userId });
  if (!userKey) {
    // If user doesn't have a key, generate one
    const adminFirstName = admin.name ? admin.name.split(' ')[0] : 'ADMIN';
    const userFirstName = user.fullName ? user.fullName.split(' ')[0] : 'USER';
    const userKeyValue = await generateUniqueUserKey(adminFirstName, userFirstName, UserKey);
    
    userKey = await UserKey.create({
      userId: user._id,
      userKey: userKeyValue,
      keyAssignedBy: adminId,
      keyAssignedAt: new Date(),
    });
  }

  // Check if key is already active
  const now = new Date();
  if (userKey.keyExpiryDate && !userKey.isExpired && userKey.keyExpiryDate >= now) {
    throw new Error('Key is still active. Cannot renew an active key.');
  }

  // Calculate new expiry date (1 year from now)
  const newExpiryDate = new Date();
  newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

  // Consume one key from admin
  await admin.consumeKey();

  // Activate/renew key - update expiry date and assignment info
  userKey.keyAssignedBy = adminId;
  userKey.keyAssignedAt = new Date(); // Update assignment date to now
  userKey.keyExpiryDate = newExpiryDate; // Set/Extend expiry by 1 year
  userKey.isExpired = false; // Reset expired flag
  await userKey.save();

  // Return user with updated key info
  return getUserById(userId);
};

/**
 * Activate a key for a user (when key is not activated yet)
 * @param {String} userId - User ID
 * @param {String} adminId - Admin ID who is activating the key
 * @returns {Promise<Object>} Updated user object
 */
const activateKey = async (userId, adminId) => {
  return activateOrRenewKey(userId, adminId);
};

/**
 * Renew an expired key for a user (keeps the same key, just extends expiry)
 * Can also be used to activate an inactive key
 * @param {String} userId - User ID
 * @param {String} adminId - Admin ID who is renewing the key
 * @returns {Promise<Object>} Updated user object
 */
const renewKey = async (userId, adminId) => {
  return activateOrRenewKey(userId, adminId);
};

/**
 * Register or update FCM token for a user
 * @param {String} userId - User ID
 * @param {String} fcmToken - FCM token from mobile device
 * @returns {Promise<Object>} Updated user device object
 */
const registerFcmToken = async (userId, fcmToken) => {
  logger.info({ userId, fcmTokenPrefix: fcmToken ? fcmToken.substring(0, 20) + '...' : null }, 'Starting FCM token registration');

  if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.trim().length === 0) {
    logger.warn({ userId }, 'FCM token registration failed: token is required');
    throw new Error('FCM token is required');
  }

  // Check if user exists
  const user = await ClientUser.findById(userId);
  if (!user) {
    logger.warn({ userId }, 'FCM token registration failed: user not found');
    throw new Error('User not found');
  }

  logger.debug({ userId }, 'User found, updating/creating user device record');

  // Update or create user device record with FCM token
  const userDevice = await UserDevice.findOneAndUpdate(
    { userId },
    { 
      fcmToken: fcmToken.trim(),
      // Optionally update deviceId if provided, but don't require it
    },
    { upsert: true, new: true }
  );

  logger.info({ userId, userDeviceId: userDevice?._id }, 'FCM token registration completed successfully');

  return userDevice;
};

module.exports = {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  activateKey,
  renewKey,
  registerFcmToken,
};
