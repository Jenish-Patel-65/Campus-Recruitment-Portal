const getPaginationParams = (query, defaultLimit = 10, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit) || defaultLimit));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

const formatPaginatedResponse = (data, totalRecords, page, limit) => {
  const totalPages = Math.ceil(totalRecords / limit);
  
  // If requested page exceeds totalPages, data will naturally be empty but pagination metadata remains accurate.

  return {
    status: 'success',
    data,
    pagination: {
      total: parseInt(totalRecords),
      page,
      limit,
      totalPages: totalPages === 0 ? 1 : totalPages // At least 1 page even if 0 records
    }
  };
};

module.exports = {
  getPaginationParams,
  formatPaginatedResponse,
};
