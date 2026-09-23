// utils/pagination.js
export const getPagination = (
  query: { page?: unknown; limit?: unknown },
  defaults = { page: 1, limit: 20 }
) => {
  const page = Math.max(1, Number(query.page) || defaults.page);
  const limit = Math.max(1, Math.min(100, Number(query.limit) || defaults.limit));
  return { page, limit, skip: (page - 1) * limit };
};

export const buildPaginationMeta = (total: number, page: number, limit: number) => ({
  total,
  page,
  pages: Math.ceil(total / limit) || 1,
});