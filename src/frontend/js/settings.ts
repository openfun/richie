export const API_LIST_DEFAULT_PARAMS = {
  limit: '21',
  offset: '0',
};

export const EDX_CSRF_TOKEN_COOKIE_NAME = 'edx_csrf_token';

export const RICHIE_USER_TOKEN = 'RICHIE_USER_TOKEN';

export const REACT_QUERY_SETTINGS = {
  // Cache is garbage collected after this delay
  cacheTime: 24 * 60 * 60 * 1000, // 24h in ms
  // Data are considered as stale after this delay
  staleTimes: {
    default: 0, // Stale immediately
    // session lifetime should be synchronized with the access token lifetime of your authentication
    // service. For example if you are using djangorestframework-simplejwt default value
    // is 5 minutes.
    session: 5 * 60 * 1000, // 5 minutes in ms
    sessionItems: 20 * 60 * 1000, // 20 minutes, items related to the session should not be refreshed as the frequency than session information.
  },
  cacheStorage: {
    // The key used to persist cache within cache storage
    key: 'RICHIE_PERSISTED_QUERIES',
    // Cache storage throttle time
    throttleTime: 500,
  },
};
