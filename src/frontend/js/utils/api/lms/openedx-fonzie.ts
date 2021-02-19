import { AuthenticationBackend, LMSBackend } from 'types/commonDataProps';
import { APILms } from 'types/api';
import OpenEdxHawthornApiInterface from './openedx-hawthorn';

/**
 *
 * OpenEdX completed by Fonzie API Implementation
 *
 * This implementation inherits from Hawthorn implementation.
 * The `user.me` method has to be overriden to retrieve user information from
 * fonzie API to retrieve a JWT Token
 *
 * Related resources:
 * https://github.com/openfun/fonzie/pull/24
 *
 */

const API = (APIConf: LMSBackend | AuthenticationBackend): APILms => {
  const ApiOptions = {
    routes: {
      user: {
        me: '/api/v1.0/user/me',
      },
    },
  };

  return OpenEdxHawthornApiInterface(APIConf, ApiOptions);
};

export default API;
