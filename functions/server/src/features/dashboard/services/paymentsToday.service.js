const EMIPayment = require('../../emi/models/emi.payment.model');
const EMI = require('../../emi/models/emi.model');
const ClientUser = require('../../users/models/user.model');
const { parsePagination, buildPaginationResponse, parseSort } = require('../../../utils/pagination');

/**
 * Get IST (Indian Standard Time) date helpers
 * IST is UTC+5:30
 */
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds

/**
 * Get start of today (00:00:00) in IST, returned as UTC date for MongoDB queries
 * IST midnight = UTC 18:30 previous day
 * Example: IST Dec 20 00:00:00 = UTC Dec 19 18:30:00
 */
const getStartOfTodayIST = () => {
  const nowUTC = new Date(); // Current UTC time
  const istNow = new Date(nowUTC.getTime() + IST_OFFSET_MS); // Current IST time
  
  // Get date components in IST
  const year = istNow.getUTCFullYear();
  const month = istNow.getUTCMonth();
  const date = istNow.getUTCDate();
  
  // IST midnight of this date = UTC 18:30 previous day
  // Create UTC date for previous day at 18:30:00
  // Use setUTCDate to handle month boundaries correctly
  const prevDayUTC = new Date(Date.UTC(year, month, date, 0, 0, 0, 0));
  prevDayUTC.setUTCDate(prevDayUTC.getUTCDate() - 1);
  prevDayUTC.setUTCHours(18, 30, 0, 0);
  
  return prevDayUTC;
};


/**
 * Get payments today for admin
 * Returns overdue payments (before today, not paid) grouped by dueDate and today's paid payments
 * All dates are calculated in IST timezone
 * @param {String} adminId - Admin ID
 * @param {Object} query - Query parameters (search, page, limit, etc.)
 * @returns {Promise<Object>} Payments data
 */
exports.getPaymentsToday = async (adminId, query = {}) => {
  // Get all user IDs created by this admin
  const userIds = await ClientUser.find({ createdBy: adminId }).select('_id').lean();
  const userIdArray = userIds.map(u => u._id);

  if (userIdArray.length === 0) {
    return {
      pendingPayments: [],
      todayPayments: [],
      pendingStats: { count: 0, totalAmount: 0 },
      todayStats: { count: 0, totalAmount: 0 }
    };
  }

  const { page, limit, skip } = parsePagination(query);
  const sort = parseSort(query, 'dueDate', 'desc'); // Default to descending order (newest dates first)

  // Build search filter
  let searchFilter = {};
  if (query.search && query.search.trim()) {
    // Search in user name, bill number, or EMI description
    const searchRegex = { $regex: query.search.trim(), $options: 'i' };
    
    // Get matching user IDs
    const matchingUsers = await ClientUser.find({
      _id: { $in: userIdArray },
      $or: [
        { fullName: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex }
      ]
    }).select('_id').lean();
    const matchingUserIds = matchingUsers.map(u => u._id);

    // Get matching EMI IDs
    const matchingEmis = await EMI.find({
      user: { $in: userIdArray },
      $or: [
        { billNumber: searchRegex },
        { description: searchRegex }
      ]
    }).select('_id').lean();
    const matchingEmiIds = matchingEmis.map(e => e._id);

    // Build $or conditions - only include non-empty arrays
    const orConditions = [];
    if (matchingUserIds.length > 0) {
      orConditions.push({ userId: { $in: matchingUserIds } });
    }
    if (matchingEmiIds.length > 0) {
      orConditions.push({ emiId: { $in: matchingEmiIds } });
    }

    // If no matches found, set filter to return no results (but stats will still show totals)
    if (orConditions.length === 0) {
      searchFilter = { _id: { $in: [] } }; // Empty filter to return no results
    } else {
      searchFilter = { $or: orConditions };
    }
  }

  // Build date range filters
  // For dueDate: stored as calendar date (YYYY-MM-DD 00:00:00 UTC)
  // For paidDate: stored as actual UTC timestamp
  let dateFilterPending = {}; // For pending payments (filters dueDate)
  let dateFilterToday = {}; // For today's payments (filters paidDate)
  
  if (query.fromDate || query.toDate) {
    // Parse fromDate and toDate (they come as YYYY-MM-DD strings)
    let fromDateUTC = null;
    let toDateUTC = null;
    
    if (query.fromDate) {
      // Convert YYYY-MM-DD to UTC date at 00:00:00 (calendar date format, same as dueDate storage)
      const fromDateParts = query.fromDate.split('-');
      fromDateUTC = new Date(Date.UTC(
        parseInt(fromDateParts[0]),
        parseInt(fromDateParts[1]) - 1, // Month is 0-indexed
        parseInt(fromDateParts[2]),
        0, 0, 0, 0
      ));
    }
    
    if (query.toDate) {
      // Convert YYYY-MM-DD to UTC date at 00:00:00, then add 1 day for $lt comparison
      const toDateParts = query.toDate.split('-');
      toDateUTC = new Date(Date.UTC(
        parseInt(toDateParts[0]),
        parseInt(toDateParts[1]) - 1, // Month is 0-indexed
        parseInt(toDateParts[2]) + 1, // Add 1 day for $lt comparison
        0, 0, 0, 0
      ));
    }
    
    // For pending payments: filter by dueDate (calendar date format)
    if (fromDateUTC && toDateUTC) {
      dateFilterPending = {
        dueDate: { $gte: fromDateUTC, $lt: toDateUTC }
      };
    } else if (fromDateUTC) {
      dateFilterPending = {
        dueDate: { $gte: fromDateUTC }
      };
    } else if (toDateUTC) {
      dateFilterPending = {
        dueDate: { $lt: toDateUTC }
      };
    }
    
    // For today's payments: filter by paidDate (UTC timestamp)
    // Convert calendar dates to IST date range, then to UTC
    if (fromDateUTC || toDateUTC) {
      let paidFromUTC = null;
      let paidToUTC = null;
      
      if (fromDateUTC) {
        // Start of fromDate in IST = previous day 18:30 UTC
        const fromDateParts = query.fromDate.split('-');
        const fromYear = parseInt(fromDateParts[0]);
        const fromMonth = parseInt(fromDateParts[1]) - 1;
        const fromDay = parseInt(fromDateParts[2]);
        paidFromUTC = new Date(Date.UTC(fromYear, fromMonth, fromDay - 1, 18, 30, 0, 0));
      }
      
      if (toDateUTC) {
        // End of toDate in IST = same day 18:29:59.999 UTC
        const toDateParts = query.toDate.split('-');
        const toYear = parseInt(toDateParts[0]);
        const toMonth = parseInt(toDateParts[1]) - 1;
        const toDay = parseInt(toDateParts[2]);
        paidToUTC = new Date(Date.UTC(toYear, toMonth, toDay, 18, 29, 59, 999));
      }
      
      if (paidFromUTC && paidToUTC) {
        dateFilterToday = {
          paidDate: { $gte: paidFromUTC, $lte: paidToUTC }
        };
      } else if (paidFromUTC) {
        dateFilterToday = {
          paidDate: { $gte: paidFromUTC }
        };
      } else if (paidToUTC) {
        dateFilterToday = {
          paidDate: { $lte: paidToUTC }
        };
      }
    }
    
    console.log('[PaymentsToday] Date range filters:', {
      fromDate: query.fromDate,
      toDate: query.toDate,
      dateFilterPending,
      dateFilterToday,
      fromDateUTC: fromDateUTC?.toISOString(),
      toDateUTC: toDateUTC?.toISOString()
    });
  }

  // Get today's date in IST
  // dueDate is stored as calendar-selected date (YYYY-MM-DD 00:00:00 UTC format)
  // This represents the calendar date in IST, not the actual UTC time
  // So if Dec 20 is selected, it's stored as 2025-12-20T00:00:00.000Z
  const nowUTC = new Date();
  const istNow = new Date(nowUTC.getTime() + IST_OFFSET_MS);
  const todayISTYear = istNow.getUTCFullYear();
  const todayISTMonth = istNow.getUTCMonth();
  const todayISTDate = istNow.getUTCDate();
  
  // Today's date in IST as stored in DB (calendar-selected format: YYYY-MM-DD 00:00:00 UTC)
  // This represents today's calendar date, not the actual UTC time
  const todayISTAsUTC = new Date(Date.UTC(todayISTYear, todayISTMonth, todayISTDate, 0, 0, 0, 0));
  
  // For overdue: dueDate <= today's calendar date (including today)
  // Since dueDate is stored as calendar date at 00:00 UTC, we compare the date part
  // If today is Dec 20, we want dueDate <= Dec 20, so payments due on Dec 20 or earlier
  // Use tomorrow's date for $lt to include today
  const tomorrowISTAsUTC = new Date(Date.UTC(todayISTYear, todayISTMonth, todayISTDate + 1, 0, 0, 0, 0));
  const beforeTodayUTC = tomorrowISTAsUTC; // Use tomorrow for $lt to include today
  
  // For paidDate: it's stored as actual UTC timestamp when payment was made
  // So we need IST date range converted to UTC
  const todayUTCStart = getStartOfTodayIST(); // Start of today in IST (as UTC)
  const tomorrowISTStart = new Date(todayUTCStart.getTime() + (24 * 60 * 60 * 1000)); // Add 24 hours

  // Base filters without search (for stats calculation)
  // Pending/Overdue: Show all pending/overdue payments with dueDate <= today (including today)
  // This shows overdue payments and payments due today
  // Apply status filter if provided, otherwise show both pending and overdue
  const statusFilter = query.status && query.status !== 'all' 
    ? { status: query.status }
    : { status: { $in: ['pending', 'overdue'] } };
  
  const basePendingFilters = {
    userId: { $in: userIdArray },
    ...statusFilter,
    dueDate: { $lt: beforeTodayUTC } // Less than tomorrow = today or before (includes today)
  };
  
  // Debug: Check ALL pending payments first (no date filter)
  const allPendingNoFilter = await EMIPayment.find({
    userId: { $in: userIdArray },
    status: { $in: ['pending', 'overdue'] }
  })
  .select('dueDate status')
  .limit(20)
  .sort({ dueDate: 1 })
  .lean();
  
  console.log('[PaymentsToday] ALL pending/overdue payments (no date filter):', {
    total: allPendingNoFilter.length,
    payments: allPendingNoFilter.map(p => ({
      dueDate: p.dueDate?.toISOString(),
      dueDateIST: p.dueDate ? new Date(p.dueDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short' }) : null,
      status: p.status,
      isBeforeToday: p.dueDate ? p.dueDate < beforeTodayUTC : false,
      comparison: p.dueDate ? `${p.dueDate.toISOString()} < ${beforeTodayUTC.toISOString()} = ${p.dueDate < beforeTodayUTC}` : 'N/A',
      isTodayOrBefore: p.dueDate ? p.dueDate < beforeTodayUTC : false
    }))
  });
  
  // Debug: Count what matches the filter
  const overdueCount = await EMIPayment.countDocuments(basePendingFilters);
  console.log('[PaymentsToday] Overdue payments matching filter:', {
    count: overdueCount,
    beforeTodayUTC: beforeTodayUTC.toISOString(),
    note: 'Filter includes payments due today (dueDate < tomorrow)',
    filter: {
      userId: { $in: `${userIdArray.length} user IDs` },
      status: { $in: ['pending', 'overdue'] },
      dueDate: { $lt: beforeTodayUTC.toISOString() }
    }
  });
  
  // Today's Paid: Show all payments that were PAID today (regardless of due date)
  // If a payment was due yesterday but paid today, it should show here
  const baseTodayFilters = {
    userId: { $in: userIdArray },
    status: 'paid',
    paidDate: { 
      $exists: true,
      $ne: null,
      $gte: todayUTCStart, 
      $lt: tomorrowISTStart 
    } // Paid today in IST (paidDate is stored as UTC timestamp, so we use IST range converted to UTC)
  };
  
  // Debug logging
  console.log('[PaymentsToday] Date Ranges:', {
    // For dueDate comparison (calendar-selected dates)
    todayISTAsUTC: todayISTAsUTC.toISOString(),
    beforeTodayUTC: beforeTodayUTC.toISOString(),
    // For paidDate comparison (actual UTC timestamps)
    todayStartUTC: todayUTCStart.toISOString(),
    tomorrowStartUTC: tomorrowISTStart.toISOString(),
    currentUTC: new Date().toISOString(),
    currentIST: new Date(new Date().getTime() + IST_OFFSET_MS).toISOString(),
    istDateComponents: {
      year: todayISTYear,
      month: todayISTMonth,
      date: todayISTDate
    }
  });
  
  // Debug: Check ALL paid payments (not filtered by date) to see what we have
  const allPaidPayments = await EMIPayment.find({
    userId: { $in: userIdArray },
    status: 'paid',
    paidDate: { $exists: true, $ne: null }
  })
  .select('paidDate status')
  .limit(20)
  .sort({ paidDate: -1 })
  .lean();
  
  console.log('[PaymentsToday] All paid payments (last 20):', allPaidPayments.map(p => ({
    paidDate: p.paidDate?.toISOString(),
    paidDateIST: p.paidDate ? new Date(p.paidDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'medium' }) : null,
    status: p.status
  })));
  
  // Debug: Check for any payments with paidDate on Dec 20 in UTC (regardless of IST)
  const dec20UTCStart = new Date('2025-12-20T00:00:00.000Z');
  const dec20UTCEnd = new Date('2025-12-21T00:00:00.000Z');
  const dec20UTCPayments = await EMIPayment.find({
    userId: { $in: userIdArray },
    status: 'paid',
    paidDate: { $gte: dec20UTCStart, $lt: dec20UTCEnd }
  })
  .select('paidDate status')
  .lean();
  
  console.log('[PaymentsToday] Dec 20, 2025 UTC payments:', {
    count: dec20UTCPayments.length,
    payments: dec20UTCPayments.map(p => ({
      paidDate: p.paidDate?.toISOString(),
      paidDateIST: p.paidDate ? new Date(p.paidDate).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'short', timeStyle: 'medium' }) : null
    }))
  });
  
  // Debug: Count payments in the IST date range
  const countInRange = await EMIPayment.countDocuments(baseTodayFilters);
  console.log('[PaymentsToday] Payments matching IST today filter:', countInRange);

  // Filters with search and date range (for payment lists)
  const pendingFilters = {
    ...basePendingFilters,
    ...dateFilterPending, // Apply date filter to pending payments
    ...searchFilter
  };

  const todayFilters = {
    ...baseTodayFilters,
    ...dateFilterToday, // Apply date filter to today's payments
    ...searchFilter
  };

  // Calculate stats from ALL data (without search filter)
  const allPendingPayments = await EMIPayment.find(basePendingFilters).lean();
  const allTodayPayments = await EMIPayment.find(baseTodayFilters).lean();

  const pendingStats = {
    count: allPendingPayments.length,
    totalAmount: allPendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  };

  const todayStats = {
    count: allTodayPayments.length,
    totalAmount: allTodayPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  };

  // Get filtered pending payments with pagination
  const pendingTotal = await EMIPayment.countDocuments(pendingFilters);
  const pendingPayments = await EMIPayment.find(pendingFilters)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('emiId', 'billNumber totalAmount description')
    .populate('userId', 'fullName mobile email')
    .lean();
  
  console.log('[PaymentsToday] Fetched pending payments:', {
    total: pendingTotal,
    fetched: pendingPayments.length,
    payments: pendingPayments.map(p => ({
      _id: p._id,
      dueDate: p.dueDate?.toISOString(),
      status: p.status,
      hasEmiId: !!p.emiId,
      hasUserId: !!p.userId,
      emiId: p.emiId?._id || p.emiId,
      userId: p.userId?._id || p.userId
    }))
  });

  // Get filtered today's paid payments (no pagination for today's - show all)
  const todayPayments = await EMIPayment.find(todayFilters)
    .sort({ paidDate: -1 })
    .populate('emiId', 'billNumber totalAmount description')
    .populate('userId', 'fullName mobile email')
    .lean();
  
  console.log('[PaymentsToday] Fetched today payments:', {
    count: todayPayments.length,
    payments: todayPayments.map(p => ({
      _id: p._id,
      paidDate: p.paidDate?.toISOString(),
      status: p.status,
      hasEmiId: !!p.emiId,
      hasUserId: !!p.userId
    }))
  });

  // Group pending payments by dueDate
  const pendingByDate = {};
  pendingPayments.forEach(payment => {
    if (payment.dueDate) {
      const dueDateStr = new Date(payment.dueDate).toISOString().split('T')[0];
      if (!pendingByDate[dueDateStr]) {
        pendingByDate[dueDateStr] = [];
      }
      pendingByDate[dueDateStr].push(payment);
    }
  });

  // Convert to array and sort by date (descending - newest dates first)
  const pendingGrouped = Object.entries(pendingByDate)
    .map(([date, payments]) => ({
      date,
      payments: payments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Descending order (newest first)

  console.log('[PaymentsToday] Final response:', {
    pendingGroupedCount: pendingGrouped.length,
    pendingGroupedDates: pendingGrouped.map(g => ({ date: g.date, count: g.payments.length })),
    todayPaymentsCount: todayPayments.length,
    pendingStats,
    todayStats
  });

  return {
    pendingPayments: pendingGrouped,
    todayPayments,
    pendingStats,
    todayStats,
    pagination: buildPaginationResponse(pendingPayments, pendingTotal, page, limit)
  };
};

