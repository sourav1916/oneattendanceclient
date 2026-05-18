import apiCall from './api';

const STATUS_CACHE_TTL_MS = 2000;
const statusRequestCache = new Map();

const getCacheKey = (companyId) => (companyId ? String(companyId) : 'default');

export const fetchCurrentAttendanceStatus = async (companyId, { forceRefresh = false } = {}) => {
  const cacheKey = getCacheKey(companyId);
  const now = Date.now();
  const cached = statusRequestCache.get(cacheKey);

  if (!forceRefresh && cached) {
    if (cached.promise) {
      return cached.promise;
    }

    if (cached.data && cached.expiresAt > now) {
      return cached.data;
    }
  }

  const request = (async () => {
    const response = await apiCall('/attendance/current-status', 'GET', null, companyId);
    const data = await response.json();

    if (!response.ok || !data.success) {
      const error = new Error(data.message || 'Failed to fetch attendance status');
      error.response = response;
      error.data = data;
      throw error;
    }

    return data;
  })();

  statusRequestCache.set(cacheKey, { promise: request, data: null, expiresAt: 0 });

  try {
    const data = await request;
    statusRequestCache.set(cacheKey, {
      data,
      expiresAt: Date.now() + STATUS_CACHE_TTL_MS,
    });
    return data;
  } catch (error) {
    const current = statusRequestCache.get(cacheKey);
    if (current?.promise === request) {
      statusRequestCache.delete(cacheKey);
    }
    throw error;
  }
};

