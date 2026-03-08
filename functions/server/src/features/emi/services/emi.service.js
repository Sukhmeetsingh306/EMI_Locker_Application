const EMI = require('../models/emi.model');
const EMIPayment = require('../models/emi.payment.model');
const ClientUser = require('../../users/models/user.model');
const UserDevice = require('../../users/models/userDevice.model');
const UserKey = require('../../users/models/userKey.model');
const Admin = require('../../admins/models/admin.model');
const { generateUniqueUserKey } = require('../../../utils/keyGenerator');
const { parsePagination, buildPaginationResponse, parseFilters, parseSort, buildSearchFilter } = require('../../../utils/pagination');

// Auto bill number
const generateBillNumber = async () => {
  const count = await EMI.countDocuments();
  return `BILL-${(count + 1).toString().padStart(6, '0')}`;
};

// Helper function to get next occurrence of a due date after start date
const getNextDueDate = (startDate, dueDay) => {
  const start = new Date(startDate);
  // Normalize start date to midnight for comparison
  start.setHours(0, 0, 0, 0);
  
  const currentYear = start.getFullYear();
  const currentMonth = start.getMonth();
  
  // Get today's date normalized to midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Try current month first
  let installmentDate = new Date(currentYear, currentMonth, dueDay);
  // Normalize to midnight for comparison
  installmentDate.setHours(0, 0, 0, 0);
  
  // Check if date is invalid (e.g., Feb 30 becomes March 2)
  const isValidDate = installmentDate.getDate() === dueDay && 
                      installmentDate.getMonth() === currentMonth &&
                      installmentDate.getFullYear() === currentYear;
  
  // If the due date in current month is in the past (before today) or invalid, move to next month
  // Allow dates that are today or in the future (>= today)
  if (!isValidDate || installmentDate < today) {
    installmentDate = new Date(currentYear, currentMonth + 1, dueDay);
    installmentDate.setHours(0, 0, 0, 0);
    
    // Handle invalid dates (e.g., Feb 30)
    if (installmentDate.getDate() !== dueDay) {
      installmentDate = new Date(currentYear, currentMonth + 1, 0); // Last day of next month
      installmentDate.setHours(0, 0, 0, 0);
    }
  }
  
  return installmentDate;
};

// Helper function to generate payment schedule
const generatePaymentSchedule = (startDate, paymentScheduleType, dueDates, totalAmount, paymentSchedule) => {
  const start = new Date(startDate);
  const scheduleMonths = paymentScheduleType ? parseInt(paymentScheduleType) : null; // 1, 3, 6, 9, 12, or 18 months (null for custom)
  
  const payments = [];
  let installmentNumber = 1;
  
  // If custom payment schedule is provided, use it (fully flexible mode)
  if (paymentSchedule && Array.isArray(paymentSchedule) && paymentSchedule.length > 0) {
    for (const scheduleItem of paymentSchedule) {
      let installmentDate;
      
      // Support both specific date and day-of-month
      if (scheduleItem.dueDate) {
        // Specific date provided
        installmentDate = new Date(scheduleItem.dueDate);
      } else if (scheduleItem.dueDay) {
        // Day of month provided - get next occurrence after start date
        installmentDate = getNextDueDate(startDate, scheduleItem.dueDay);
      } else {
        // Fallback: use start date if no dueDate/dueDay in schedule item and no dueDates array
        // This should rarely happen since custom schedule items should have dueDate
        if (dueDates && dueDates.length > 0) {
          installmentDate = getNextDueDate(startDate, dueDates[0] || 1);
        } else {
          // No dueDates available, use start date
          installmentDate = new Date(startDate);
        }
      }
      
      // Calculate amount and percentage
      let amount = 0;
      let percentage = null;
      
      if (scheduleItem.amount !== undefined && scheduleItem.amount !== null && scheduleItem.amount !== '') {
        // Amount is provided
        amount = parseFloat(scheduleItem.amount) || 0;
        if (totalAmount > 0) {
          percentage = (amount / totalAmount) * 100;
        }
      } else if (scheduleItem.percentage !== undefined && scheduleItem.percentage !== null && scheduleItem.percentage !== '') {
        // Percentage is provided - calculate amount
        percentage = parseFloat(scheduleItem.percentage) || 0;
        amount = (percentage / 100) * totalAmount;
      } else {
        // Neither provided, default to 0
        amount = 0;
        percentage = 0;
      }
      
      payments.push({
        installmentNumber: installmentNumber++,
        dueDate: installmentDate,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
        percentage: percentage ? Math.round(percentage * 100) / 100 : null,
      });
    }
  } else {
    // Generate equal installments based on due dates
    // Start from next occurrence of each due date after start date
    // dueDates should not be empty for equal installments (validated earlier)
    if (!dueDates || dueDates.length === 0) {
      throw new Error('dueDates is required for equal installments mode');
    }
    if (!scheduleMonths) {
      throw new Error('paymentScheduleType is required for equal installments mode');
    }
    const totalInstallments = scheduleMonths * dueDates.length;
    const equalAmount = totalAmount / totalInstallments;
    
    // Generate all installment dates
    const allDates = [];
    
    // For each month in the schedule
    for (let monthOffset = 0; monthOffset < scheduleMonths; monthOffset++) {
      // For each due date
      for (const dueDay of dueDates) {
        let installmentDate;
        
        if (monthOffset === 0) {
          // First month: get next occurrence after start date
          installmentDate = getNextDueDate(startDate, dueDay);
        } else {
          // Subsequent months: get the base date (first occurrence) and add months
          const baseDate = getNextDueDate(startDate, dueDay);
          installmentDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset, dueDay);
          
          // Handle invalid dates (e.g., Feb 30)
          if (installmentDate.getDate() !== dueDay) {
            installmentDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + monthOffset + 1, 0); // Last day of month
          }
        }
        
        allDates.push({
          dueDate: installmentDate,
          amount: Math.round(equalAmount * 100) / 100,
          percentage: Math.round((equalAmount / totalAmount) * 100 * 100) / 100,
        });
      }
    }
    
    // Sort all dates chronologically
    allDates.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    // Create payments with sequential installment numbers
    allDates.forEach((item, index) => {
      payments.push({
        installmentNumber: index + 1,
        dueDate: item.dueDate,
        amount: item.amount,
        percentage: item.percentage,
      });
    });
  }
  
  return payments;
};

// Create EMI
const createEmi = async (payload) => {
  const { 
    userId, 
    principalAmount,
    interestPercentage,
    totalAmount, 
    description,
    paymentScheduleType, 
    startDate, 
    dueDates, 
    paymentSchedule 
  } = payload;

  // Validation with detailed error messages
  console.log('EMI Creation Payload received:', payload);
  
  if (!userId || userId === '') {
    throw new Error('Missing required field: userId');
  }
  if (principalAmount === undefined || principalAmount === null || principalAmount === '' || isNaN(Number(principalAmount)) || Number(principalAmount) <= 0) {
    throw new Error(`Missing or invalid required field: principalAmount (received: ${principalAmount}, type: ${typeof principalAmount})`);
  }
  if (interestPercentage === undefined || interestPercentage === null || interestPercentage === '' || isNaN(Number(interestPercentage)) || Number(interestPercentage) < 0) {
    throw new Error(`Missing or invalid required field: interestPercentage (received: ${interestPercentage}, type: ${typeof interestPercentage})`);
  }
  if (totalAmount === undefined || totalAmount === null || totalAmount === '' || isNaN(Number(totalAmount)) || Number(totalAmount) <= 0) {
    throw new Error(`Missing or invalid required field: totalAmount (received: ${totalAmount}, type: ${typeof totalAmount})`);
  }
  if (!description || description.trim() === '') {
    throw new Error('Missing required field: description');
  }
  // Check if custom schedule is provided
  const hasCustomSchedule = paymentSchedule && Array.isArray(paymentSchedule) && paymentSchedule.length > 0;
  
  // paymentScheduleType is only required for equal installments mode (not custom schedule)
  if (!hasCustomSchedule) {
    if (!paymentScheduleType || paymentScheduleType === '') {
      throw new Error('Missing required field: paymentScheduleType (required for equal installments)');
    }
  }
  if (!startDate || startDate === '') {
    throw new Error('Missing required field: startDate');
  }

  // dueDates is required for equal installments, but optional for custom schedule
  // (since dates are in paymentSchedule items for custom mode)
  if (!dueDates || !Array.isArray(dueDates)) {
    throw new Error('dueDates must be an array');
  }
  
  // For equal installments mode (no custom schedule), dueDates must not be empty
  if (!hasCustomSchedule && dueDates.length === 0) {
    throw new Error('Missing required field: dueDates (required for equal installments)');
  }

  // paymentScheduleType validation - only required for equal installments
  let finalPaymentScheduleType = paymentScheduleType;
  if (!hasCustomSchedule) {
    if (!['1', '3', '6', '9', '12', '18'].includes(paymentScheduleType)) {
      throw new Error('paymentScheduleType must be one of: 1, 3, 6, 9, 12, 18');
    }
  } else {
    // For custom schedules, paymentScheduleType is optional
    // If provided, validate it, otherwise set to null/undefined
    if (paymentScheduleType && paymentScheduleType !== '') {
      if (!['1', '3', '6', '9', '12', '18'].includes(paymentScheduleType)) {
        throw new Error('paymentScheduleType must be one of: 1, 3, 6, 9, 12, 18');
      }
    } else {
      // Not provided for custom schedule - that's fine, set to null
      finalPaymentScheduleType = null;
    }
  }

  // Validate due dates are between 1 and 31 (only if dueDates array is not empty)
  if (dueDates.length > 0) {
    for (const day of dueDates) {
      if (day < 1 || day > 31) {
        throw new Error('dueDates must be between 1 and 31');
      }
    }
  }

  // Validate payment schedule if provided
  if (paymentSchedule && Array.isArray(paymentSchedule)) {
    let totalScheduleAmount = 0;
    let totalSchedulePercentage = 0;
    
    for (const item of paymentSchedule) {
      if (item.amount !== undefined && item.amount !== null && item.amount !== '') {
        const itemAmount = parseFloat(item.amount) || 0;
        if (itemAmount <= 0) {
          throw new Error('All payment schedule amounts must be greater than 0');
        }
        totalScheduleAmount += itemAmount;
      }
      if (item.percentage !== undefined && item.percentage !== null && item.percentage !== '') {
        totalSchedulePercentage += parseFloat(item.percentage) || 0;
      }
      
      // Note: dueDate and dueDay are no longer required - dates will be auto-calculated
      // But if provided, validate them (for backward compatibility)
      if (item.dueDate) {
        const date = new Date(item.dueDate);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid dueDate in payment schedule');
        }
      }
      if (item.dueDay && (item.dueDay < 1 || item.dueDay > 31)) {
        throw new Error('dueDay in payment schedule must be between 1 and 31');
      }
    }
    
    // Validate that custom schedule total equals the total amount (allow small rounding differences)
    if (paymentSchedule.length > 0 && totalScheduleAmount > 0) {
      const totalAmountNum = Number(totalAmount);
      const difference = Math.abs(totalScheduleAmount - totalAmountNum);
      if (difference > 0.01) {
        throw new Error(`The sum of all payment schedule amounts (${totalScheduleAmount.toFixed(2)}) must equal the total amount (${totalAmountNum.toFixed(2)}). Please adjust the amounts.`);
      }
    }
    
    // Warn if percentages don't add up to 100% (but allow it for flexibility)
    if (totalSchedulePercentage > 0 && Math.abs(totalSchedulePercentage - 100) > 0.01) {
      console.warn(`Payment schedule percentages sum to ${totalSchedulePercentage}%, not 100%`);
    }
  }
  
  // Check if this is the first EMI for the user
  const existingEmiCount = await EMI.countDocuments({ user: userId });
  const isFirstEmi = existingEmiCount === 0;
  
  // Get user key
  let userKey = await UserKey.findOne({ userId });
  
  if (isFirstEmi) {
    // First EMI: Activate the key
    const user = await ClientUser.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get the admin ID - prefer the admin creating the EMI, fallback to user's creator
    const adminId = payload.adminId || user.createdBy;
    if (!adminId) {
      throw new Error('Cannot determine admin for key activation.');
    }
    
    const admin = await Admin.findById(adminId);
    if (!admin) {
      throw new Error('Admin not found');
    }
    
    if (admin.availableKeys <= 0) {
      throw new Error('No available keys. Please purchase a key package.');
    }
    
    // If user doesn't have a key, create one
    if (!userKey) {
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
    
    // Activate the key: set expiry date to 1 year from now
    const keyExpiryDate = new Date();
    keyExpiryDate.setFullYear(keyExpiryDate.getFullYear() + 1);
    
    userKey.keyExpiryDate = keyExpiryDate;
    userKey.keyAssignedBy = adminId;
    userKey.keyAssignedAt = new Date();
    userKey.isExpired = false;
    await userKey.save();
    
    // Consume one key from admin
    await admin.consumeKey();
  } else {
    // Not first EMI: Check if key is active
    if (!userKey) {
      throw new Error('User key not found. Please activate the key first.');
    }
    
    const now = new Date();
    if (!userKey.keyExpiryDate) {
      throw new Error('User key is not activated. Please activate the key first.');
    }
    
    if (userKey.isExpired || userKey.keyExpiryDate < now) {
      throw new Error('User key has expired. Admin needs to renew the key to create EMIs.');
    }
  }
  
  const billNumber = await generateBillNumber();

  // Generate payment schedule
  // For custom schedules, paymentScheduleType is not used, so pass null
  const scheduleTypeForGeneration = hasCustomSchedule ? null : finalPaymentScheduleType;
  const paymentScheduleData = generatePaymentSchedule(
    startDate,
    scheduleTypeForGeneration,
    dueDates,
    totalAmount,
    paymentSchedule
  );

  const totalInstallments = paymentScheduleData.length;

  // Create EMI
  // For custom schedules, paymentScheduleType can be null/undefined
  const emiData = {
    user: userId,
    principalAmount: Number(principalAmount),
    interestPercentage: Number(interestPercentage),
    totalAmount: Number(totalAmount),
    description,
    dueDates,
    totalInstallments,
    startDate,
    billNumber,
    createdBy: payload.adminId, // Track which admin created this EMI
  };
  
  // Only include paymentScheduleType if it's provided (for equal installments)
  if (finalPaymentScheduleType) {
    emiData.paymentScheduleType = finalPaymentScheduleType;
  }
  
  const emi = await EMI.create(emiData);

  // Create payment schedule records
  const payments = paymentScheduleData.map(p => ({
    emiId: emi._id,
    userId,
    installmentNumber: p.installmentNumber,
    dueDate: p.dueDate,
    amount: p.amount,
    percentage: p.percentage,
  }));

  await EMIPayment.insertMany(payments);

  // Populate user and createdBy before returning
  const emiWithDetails = await EMI.findById(emi._id)
    .populate('user')
    .populate('createdBy', 'name email');
  
  return emiWithDetails;
};

// List EMIs with pagination
const listEmis = async (query = {}, adminId = null, adminRole = null) => {
  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, 'createdAt', 'desc');
  
  // Build filters
  const filters = {};
  
  // Filter by admin if not superadmin
  if (adminId && adminRole !== 'superadmin') {
    // Filter EMIs to only those created by this admin
    filters.createdBy = adminId;
    
    // If userId filter is provided, also filter by user
    if (query.userId) {
      filters.user = query.userId;
    }
  } else {
    // Superadmin or no admin filter - use userId if provided
    if (query.userId) {
      filters.user = query.userId;
    }
  }
  
  // Status filter
  if (query.status) {
    filters.status = query.status;
  }
  
  // Search filter - supports billNumber, description, and user fields (name, mobile, email)
  if (query.search) {
    const searchTerm = query.search.trim();
    
    // First, search for users matching the search term (name, mobile, email)
    const userSearchFilter = buildSearchFilter(searchTerm, ['fullName', 'mobile', 'email']);
    
    // Search users (no restriction to admin's users since users can be from any admin)
    const matchingUsers = await ClientUser.find(userSearchFilter).select('_id').lean();
    const matchingUserIds = matchingUsers.map(u => u._id);
    
    // Build search filter for EMI fields
    const emiSearchFilter = buildSearchFilter(searchTerm, ['billNumber', 'description']);
    
    // Build the combined search conditions
    const searchConditions = [...(emiSearchFilter.$or || [])];
    
    // If we have matching users, add user filter condition
    if (matchingUserIds.length > 0) {
      searchConditions.push({ user: { $in: matchingUserIds } });
    }
    
    // If there are search conditions, apply them
    if (searchConditions.length > 0) {
      // If there's already a createdBy filter (from admin filtering), we need to combine properly
      if (filters.createdBy) {
        // Store the createdBy filter temporarily
        const createdByFilter = filters.createdBy;
        delete filters.createdBy;
        
        // Combine: (EMI field matches OR user matches search) AND EMI was created by this admin
        filters.$and = [
          { $or: searchConditions },
          { createdBy: createdByFilter }
        ];
      } else {
        // No admin filter, just use the search conditions
        filters.$or = searchConditions;
      }
    } else if (!filters.createdBy && !filters.user) {
      // No matching users and no EMI field matches - return empty result
      filters._id = { $in: [] };
    }
    // If filters.createdBy exists and no search matches, keep the admin filter (will show admin's EMIs)
  }
  
  // Amount range filters
  if (query.amountMin) {
    filters.totalAmount = { ...filters.totalAmount, $gte: parseFloat(query.amountMin) };
  }
  if (query.amountMax) {
    filters.totalAmount = { ...filters.totalAmount, $lt: parseFloat(query.amountMax) };
  }
  
  // Date range filters
  if (query.createdFrom) {
    filters.createdAt = { ...filters.createdAt, $gte: new Date(query.createdFrom) };
  }
  if (query.createdTo) {
    filters.createdAt = { ...filters.createdAt, $lte: new Date(query.createdTo) };
  }
  
  // Get total count
  const total = await EMI.countDocuments(filters);
  
  // Get paginated data
  const emis = await EMI.find(filters)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('user', 'fullName email mobile');
  
  return buildPaginationResponse(emis, total, page, limit);
};

// Get EMI details
const getEmiById = async (id) => {
  const emi = await EMI.findById(id)
    .populate('user')
    .populate('createdBy', 'name email');
  if (!emi) return null;
  
  return emi;
};

// Get payment schedule
const getEmiPayments = async (emiId) => {
  return EMIPayment.find({ emiId }).sort({ installmentNumber: 1 });
};

// Check active EMIs for user
const userHasActiveEmis = async (userId) => {
  const active = await EMI.countDocuments({
    user: userId,
    status: "active"
  });
  return active > 0;
};

module.exports = {
  createEmi,
  listEmis,
  getEmiById,
  getEmiPayments,
  userHasActiveEmis,
};
