import { mergeWith } from 'lodash-es';
import * as prodSettings from './settings.prod';
import * as testSettings from './settings.test';

let settingsOverride = {};
if (process.env.NODE_ENV === 'development') {
  try {
    settingsOverride = require('./settings.dev.ts');
  } catch {
    // no local settings found, do nothing
  }
} else if (process.env.NODE_ENV === 'test') {
  settingsOverride = testSettings;
}

const settings = mergeWith({}, prodSettings, settingsOverride);

export const {
  API_LIST_DEFAULT_PARAMS,
  EDX_CSRF_TOKEN_COOKIE_NAME,
  RICHIE_USER_TOKEN,
  RICHIE_LTI_ANONYMOUS_USER_ID_CACHE_KEY,
  JOANIE_API_VERSION,
  REACT_QUERY_SETTINGS,
  PAYMENT_SETTINGS,
  CONTRACT_SETTINGS,
  CONTRACT_DOWNLOAD_SETTINGS,
  PER_PAGE,
  MOCK_SERVICE_WORKER_ENABLED,
  DEBUG_UNION_RESOURCES_HOOK,
  CURRENT_JOANIE_DEV_DEMO_USER,
} = settings;
