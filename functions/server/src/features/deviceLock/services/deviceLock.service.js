const mongoose = require('mongoose');
const EMIPayment = require('../../emi/models/emi.payment.model');
const EMI = require('../../emi/models/emi.model');
const ClientUser = require('../../users/models/user.model');
const UserDevice = require('../../users/models/userDevice.model');
const { parsePagination, buildPaginationResponse, parseSort, buildSearchFilter } = require('../../../utils/pagination');

/**
 * Get users with overdue EMIs (dueDate <= today)
 * @param {String} adminId - Admin ID to filter users by
 * @param {Object} query - Query parameters (pagination, filters, search)
 * @returns {Object} Paginated list of users with overdue EMIs
 */
exports.getUsersWithOverdueEmis = async (adminId, query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, 'dueDate', 'asc');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // First, find all EMIs created by this admin
  const adminEmis = await EMI.find({ createdBy: adminId }).select('_id user billNumber').lean();
  const adminEmiIds = adminEmis.map(emi => emi._id);
  
  if (adminEmiIds.length === 0) {
    return buildPaginationResponse([], 0, page, limit);
  }

  // Get unique user IDs from these EMIs (users can be from any admin)
  const userIdsFromEmis = [...new Set(adminEmis.map(emi => emi.user.toString()))];
  const userIds = userIdsFromEmis.map(id => new mongoose.Types.ObjectId(id));

  // Get user details for these users
  const users = await ClientUser.find({ _id: { $in: userIds } }).select('_id fullName mobile email').lean();
  const userMapById = new Map(users.map(u => [u._id.toString(), u]));

  // If search is provided, we need to search in both user fields and bill numbers
  let filteredUserIds = userIds;
  if (query.search) {
    const searchTerm = query.search.trim();
    
    // 1. Search in user fields (fullName, mobile, email)
    const userSearchFilter = buildSearchFilter(searchTerm, ['fullName', 'mobile', 'email']);
    const matchingUsers = await ClientUser.find({
      _id: { $in: userIds },
      ...userSearchFilter
    }).select('_id').lean();
    const matchingUserIds = matchingUsers.map(u => u._id.toString());
    
    // 2. Search in bill numbers - find EMIs with matching bill numbers created by this admin
    const matchingEmis = await EMI.find({
      _id: { $in: adminEmiIds },
      billNumber: { $regex: searchTerm, $options: 'i' }
    }).select('user').lean();
    const billNumberUserIds = matchingEmis.map(emi => emi.user.toString());
    
    // 3. Combine both sets of user IDs (union)
    const allUserIdsStr = new Set([...matchingUserIds, ...billNumberUserIds]);
    
    // Filter to only users that match search
    filteredUserIds = userIds.filter(uid => allUserIdsStr.has(uid.toString()));
  }

  if (filteredUserIds.length === 0) {
    return buildPaginationResponse([], 0, page, limit);
  }

  // Build base filter for overdue payments (only from EMIs created by this admin)
  let paymentFilter = {
    userId: { $in: filteredUserIds },
    emiId: { $in: adminEmiIds }, // Only payments from EMIs created by this admin
    dueDate: { $lt: tomorrow },
    status: { $in: ['pending', 'overdue'] }
  };

  // Apply status filter if provided
  if (query.status && query.status !== '') {
    paymentFilter.status = query.status;
  }

  // Apply date range filters if provided
  if (query.dueDateFrom || query.dueDateTo) {
    paymentFilter.dueDate = { 
      $lt: tomorrow, // Include payments due today
      ...(query.dueDateFrom ? { $gte: new Date(query.dueDateFrom) } : {}),
      ...(query.dueDateTo ? { $lte: new Date(query.dueDateTo) } : {})
    };
  }

  // Get all overdue payments for these users (already filtered by EMI createdBy in paymentFilter)
  let overduePayments = await EMIPayment.find(paymentFilter)
    .populate('emiId', 'billNumber totalAmount createdBy')
    .sort(sort)
    .lean();

  // Group by userId and get the earliest due date payment for each user
  const userPaymentMap = new Map();
  
  overduePayments.forEach(payment => {
    const userIdStr = payment.userId.toString();
    const user = userMapById.get(userIdStr);
    
    if (!user) return; // Skip if user not found (shouldn't happen)
    
    if (!userPaymentMap.has(userIdStr)) {
      userPaymentMap.set(userIdStr, {
        userId: payment.userId,
        userName: user.fullName,
        userMobile: user.mobile,
        userEmail: user.email,
        earliestDueDate: payment.dueDate,
        earliestDueDatePayment: payment,
        overdueCount: 0,
        overduePayments: [] // Store all overdue payments
      });
    }
    
    const userData = userPaymentMap.get(userIdStr);
    userData.overdueCount += 1;
    userData.overduePayments.push(payment); // Add all payments
    
    // Update if this payment has an earlier due date
    if (payment.dueDate < userData.earliestDueDate) {
      userData.earliestDueDate = payment.dueDate;
      userData.earliestDueDatePayment = payment;
    }
  });
  
  // Sort overdue payments by due date for each user
  userPaymentMap.forEach((userData) => {
    userData.overduePayments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  });

  // Get device lock status for users with overdue payments
  const deviceMap = new Map();
  if (userPaymentMap.size > 0) {
    const overdueUserIds = Array.from(userPaymentMap.values()).map(userData => userData.userId);
    const userDevices = await UserDevice.find({ userId: { $in: overdueUserIds } })
      .select('userId deviceLocked')
      .lean();
    userDevices.forEach(d => {
      deviceMap.set(d.userId.toString(), d.deviceLocked || false);
    });
  }

  // Convert map to array
  let result = Array.from(userPaymentMap.values()).map(userData => ({
    userId: userData.userId,
    userName: userData.userName,
    userMobile: userData.userMobile,
    userEmail: userData.userEmail,
    earliestDueDate: userData.earliestDueDate,
    emiId: userData.earliestDueDatePayment.emiId?._id,
    billNumber: userData.earliestDueDatePayment.emiId?.billNumber,
    amount: userData.earliestDueDatePayment.amount || userData.earliestDueDatePayment.emiId?.totalAmount || 0,
    status: userData.earliestDueDatePayment.status,
    overdueCount: userData.overdueCount,
    deviceLocked: deviceMap.get(userData.userId.toString()) || false,
    overduePayments: userData.overduePayments.map(p => ({
      _id: p._id,
      installmentNumber: p.installmentNumber,
      dueDate: p.dueDate,
      amount: p.amount,
      status: p.status,
      paidDate: p.paidDate,
      extendDays: p.extendDays,
      extendReason: p.extendReason,
      extendedOn: p.extendedOn,
      emiId: p.emiId?._id,
      billNumber: p.emiId?.billNumber
    }))
  }));

  // Apply blocked filter if provided
  if (query.blocked !== undefined && query.blocked !== '') {
    const isBlocked = query.blocked === 'true' || query.blocked === true;
    result = result.filter(userData => userData.deviceLocked === isBlocked);
  }

  // Sort the result array (since we're grouping, we need to sort after grouping)
  if (sort.dueDate) {
    result.sort((a, b) => {
      const aDate = new Date(a.earliestDueDate);
      const bDate = new Date(b.earliestDueDate);
      return sort.dueDate === 1 ? aDate - bDate : bDate - aDate;
    });
  }

  // Get total count before pagination
  const total = result.length;

  // Apply pagination
  const paginatedResult = result.slice(skip, skip + limit);

  return buildPaginationResponse(paginatedResult, total, page, limit);
};

