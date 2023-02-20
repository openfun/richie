import context from 'utils/context';
import { JOANIE_API_VERSION, RICHIE_USER_TOKEN } from 'settings';
import { ApiClientJoanie, ApiError, OpenAPIConfig } from './gen';

/**
 * Build Joanie API Routes interface.
 */
const getAPIEndpoint = () => {
  const endpoint = context?.joanie_backend?.endpoint;
  const version = JOANIE_API_VERSION;

  if (!endpoint) {
    throw new Error('[JOANIE] - Joanie API endpoint is not defined.');
  }

  return `${endpoint}/api/${version}`;
};

const config: OpenAPIConfig = {
  BASE: getAPIEndpoint(),
  VERSION: '1',
  WITH_CREDENTIALS: false,
  CREDENTIALS: 'omit',
  TOKEN: async () => {
    return sessionStorage.getItem(RICHIE_USER_TOKEN) || '';
  },
};

export const joanieApi = new ApiClientJoanie(config);

export const isApiError = (error: unknown): error is ApiError => {
  return (error as ApiError).name === 'ApiError';
};
