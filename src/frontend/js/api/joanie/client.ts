import { RICHIE_USER_TOKEN } from 'settings';

import context from 'utils/context';
import { ApiClientJoanie, ApiError, OpenAPIConfig } from './gen';

/**
 * Build Joanie API Routes interface.
 */
export const getAPIEndpoint = () => {
  const endpoint = context?.joanie_backend?.endpoint;

  if (!endpoint) {
    throw new Error('[JOANIE] - Joanie API endpoint is not defined.');
  }

  return `${endpoint}`;
};

export const isApiError = (error: unknown): error is ApiError => {
  return (error as ApiError).name === 'ApiError';
};

export const getApiClientJoanie = () => {
  const config: OpenAPIConfig = {
    BASE: getAPIEndpoint(),
    VERSION: '1',
    WITH_CREDENTIALS: false,
    CREDENTIALS: 'omit',
    TOKEN: async () => {
      return sessionStorage.getItem(RICHIE_USER_TOKEN) || '';
    },
  };

  return new ApiClientJoanie(config);
};
