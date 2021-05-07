export const API_LIST_DEFAULT_PARAMS = {
  limit: '21',
  offset: '0',
};

export const EDX_CSRF_TOKEN_COOKIE_NAME = 'edx_csrf_token';

export const REACT_QUERY_SETTINGS = {
  // Cache is garbage collected after this delay
  cacheTime: 24 * 60 * 60 * 1000, // 24h in ms
  // Data are considered as stale after this delay
  staleTimes: {
    default: 0, // Stale immediately
    session: 15 * 60 * 1000, // 15 minutes in ms
  },
  cacheStorage: {
    // The key used to persist cache within cache storage
    key: 'RICHIE_PERSISTED_QUERIES',
    // Cache storage throttle time
    throttleTime: 500,
  },
};
