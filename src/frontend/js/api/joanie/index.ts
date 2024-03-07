import context from 'utils/context';

/**
 * Flag which determines if joanie is enabled.
 */
export const isJoanieEnabled = !!context.joanie_backend;

export {
  default as JoanieLegacyClient,
  getResponseBody as getResponseBodyLegacy,
  checkStatus as checkStatusLegacy,
  getAPIEndpoint as getAPIEndpointLegacy,
  getRoutes as getRoutesLegacy,
  buildApiUrl as buildApiUrlLegacy,
} from './joanieLegacyClient';
