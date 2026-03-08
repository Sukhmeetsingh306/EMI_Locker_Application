/**
 * Pagination utility functions
 */

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Request query object
 * @returns {Object} Pagination parameters
 */
const parsePagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10)); // Max 100 per page
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

/**
 * Build pagination response
 * @param {Array} data - Array of data
 * @param {Number} total - Total count
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @returns {Object} Paginated response
 */
const buildPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Parse filter parameters from request query
 * @param {Object} query - Request query object
 * @param {Array} allowedFilters - Array of allowed filter field names
 * @returns {Object} Filter object for MongoDB query
 */
const parseFilters = (query, allowedFilters = []) => {
  const filters = {};

  allowedFilters.forEach((field) => {
    if (query[field] !== undefined && query[field] !== null && query[field] !== '') {
      // Handle different filter types
      if (field.includes('Date') || field.includes('date')) {
        // Date range filters
        if (query[`${field}From`]) {
          filters[field] = { ...filters[field], $gte: new Date(query[`${field}From`]) };
        }
        if (query[`${field}To`]) {
          filters[field] = { ...filters[field], $lte: new Date(query[`${field}To`]) };
        }
      } else if (typeof query[field] === 'string' && query[field].includes(',')) {
        // Array filters (comma-separated)
        filters[field] = { $in: query[field].split(',').map((v) => v.trim()) };
      } else if (field.includes('search') || field.includes('Search')) {
        // Search filters (for text search)
        // This will be handled separately in the service
      } else {
        filters[field] = query[field];
      }
    }
  });

  return filters;
};

/**
 * Parse sort parameters from request query
 * @param {Object} query - Request query object
 * @param {String} defaultSort - Default sort field
 * @param {String} defaultOrder - Default sort order ('asc' or 'desc')
 * @returns {Object} Sort object for MongoDB
 */
const parseSort = (query, defaultSort = 'createdAt', defaultOrder = 'desc') => {
  const sortField = query.sortBy || defaultSort;
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

  return {
    [sortField]: sortOrder,
  };
};

/**
 * Build search filter for text fields
 * @param {String} searchTerm - Search term
 * @param {Array} searchFields - Array of field names to search in
 * @returns {Object} MongoDB search filter
 */
const buildSearchFilter = (searchTerm, searchFields = []) => {
  if (!searchTerm || searchFields.length === 0) {
    return {};
  }

  return {
    $or: searchFields.map((field) => ({
      [field]: { $regex: searchTerm, $options: 'i' },
    })),
  };
};

module.exports = {
  parsePagination,
  buildPaginationResponse,
  parseFilters,
  parseSort,
  buildSearchFilter,
};

