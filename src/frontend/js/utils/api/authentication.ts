/**
 * Authentication API
 *
 * Select the right authentication API according to authentication backend
 * provided in __richie_frontend_context
 *
 */
import { handle } from 'utils/errors/handle';
import { AuthenticationBackend } from 'types/commonDataProps';
import { Nullable } from 'utils/types';
import { ApiImplementation } from './lms';
import BaseApiInterface from './lms/base';
import OpenEdxApiInterface from './lms/edx';

const AuthenticationAPIHandler = (): Nullable<ApiImplementation['user']> => {
  const AUTHENTICATION: AuthenticationBackend = (window as any).__richie_frontend_context__?.context
    ?.authentication;
  if (!AUTHENTICATION) return null;

  switch (AUTHENTICATION.backend) {
    case 'richie.apps.courses.lms.base.BaseLMSBackend':
      return BaseApiInterface(AUTHENTICATION).user;
    case 'richie.apps.courses.lms.edx.TokenEdXLMSBackend':
      return OpenEdxApiInterface(AUTHENTICATION).user;
    default:
      handle(new Error(`No Authentication Backend found for ${AUTHENTICATION.backend}.`));
      return null;
  }
};

export const AuthenticationApi = AuthenticationAPIHandler();
