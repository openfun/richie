import context from 'utils/context';
import { JOANIE_API_VERSION } from 'settings';
import { ApiClientJoanie, OpenAPIConfig } from './gen';

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

// TODO add auth with jwt
const config: OpenAPIConfig = {
  BASE: getAPIEndpoint(),
  VERSION: '1',
  WITH_CREDENTIALS: true,
  CREDENTIALS: 'include',
  // TOKEN:
};

export const joanieApi = new ApiClientJoanie(config);
export * from './hooks';
