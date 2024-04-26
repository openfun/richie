export const API_LIST_DEFAULT_PARAMS = {
  limit: '21',
  offset: '0',
};

export const EDX_CSRF_TOKEN_COOKIE_NAME = 'edx_csrf_token';
export const RICHIE_USER_TOKEN = 'RICHIE_USER_TOKEN';
export const RICHIE_LTI_ANONYMOUS_USER_ID_CACHE_KEY = 'RICHIE_LTI_ANONYMOUS_USER_ID';

export const JOANIE_API_VERSION = 'v1.0';
export const REACT_QUERY_SETTINGS = {
  cacheStorage: {
    // The key used to persist cache within cache storage
    key: 'RICHIE_PERSISTED_QUERIES',
    // Cache storage throttle time
    throttleTime: 500,
  },
  // Cache is garbage collected after this delay
  gcTime: 24 * 60 * 60 * 1000, // 24h in ms
  // Data are considered as stale after this delay
  staleTimes: {
    default: 0, // Stale immediately
    // session lifetime should be synchronized with the access token lifetime of your authentication
    // service. For example if you are using djangorestframework-simplejwt default value
    // is 5 minutes.
    session: 5 * 60 * 1000, // 5 minutes in ms
    sessionItems: 20 * 60 * 1000, // 20 minutes, items related to the session should not be refreshed as the frequency than session information.
  },
};

export const PAYMENT_SETTINGS = {
  // Interval in ms to poll the related order when a payment has succeeded.
  pollInterval: 1000,
  // Number of retries
  pollLimit: 30,
};

export const CONTRACT_SETTINGS = {
  // Interval in ms to poll the related order when a signature has succeeded.
  pollInterval: 1500,
  // Number of retries
  pollLimit: 45,
  // Simulated sign request delay
  dummySignatureSignTimeout: 2000,
};

export const CONTRACT_DOWNLOAD_SETTINGS = {
  // Interval in ms to poll the related contract's archive.
  pollInterval: 1000,
  contractArchiveLocalStorageKey: 'RICHIE_CONTRACT_ARCHIVE',
  contractArchiveLocalVaklidityDurationMs: 10 * 60 * 60 * 1000, // 10min
};

const DEFAULT_PER_PAGE = 50;
export const PER_PAGE = {
  teacherContractList: 25,
  certificateList: 25,
  courseLearnerList: DEFAULT_PER_PAGE,
  useUnionResources: DEFAULT_PER_PAGE,
  useCourseProductUnion: DEFAULT_PER_PAGE,
  useOrdersEnrollments: DEFAULT_PER_PAGE,
};

export const MOCK_SERVICE_WORKER_ENABLED = false;
export const DEBUG_UNION_RESOURCES_HOOK = false;
