/**
 * Authentication API
 *
 * Select the right authentication API according to authentication backend
 * provided in __richie_frontend_context
 *
 */
import { handle } from 'utils/errors/handle';
import { AuthenticationBackend } from 'types/commonDataProps';
import { Nullable } from 'types/utils';
import context from 'utils/context';
import { APIAuthentication, APIBackend } from 'types/api';
import DummyApiInterface from './lms/dummy';
import OpenEdxDogwoodApiInterface from './lms/openedx-dogwood';
import OpenEdxHawthornApiInterface from './lms/openedx-hawthorn';
import OpenEdxFonzieApiInterface from './lms/openedx-fonzie';

const AuthenticationAPIHandler = (): Nullable<APIAuthentication> => {
  const AUTHENTICATION: AuthenticationBackend = context?.authentication;
  if (!AUTHENTICATION) return null;

  switch (AUTHENTICATION.backend) {
    case APIBackend.DUMMY:
      return DummyApiInterface(AUTHENTICATION).user;
    case APIBackend.OPENEDX_DOGWOOD:
      return OpenEdxDogwoodApiInterface(AUTHENTICATION).user;
    case APIBackend.OPENEDX_HAWTHORN:
      return OpenEdxHawthornApiInterface(AUTHENTICATION).user;
    case APIBackend.FONZIE:
      return OpenEdxFonzieApiInterface(AUTHENTICATION).user;
    default:
      handle(new Error(`No Authentication Backend found for ${AUTHENTICATION.backend}.`));
      return null;
  }
};

export const AuthenticationApi = AuthenticationAPIHandler();
