import { AuthenticationBackend, LMSBackend } from 'types/commonDataProps';
import { ApiImplementation } from 'types/api';
import OpenEdxHawthornApiInterface from './openedx-hawthorn';

/**
 *
 * OpenEdX Dogwood API Implementation
 *
 * This implementation inherits from Hawthorn implementation.
 * The `user.me` methods has to be overriden since `/user/v1/me` route does not
 * exist in OpenEdX Dogwood & Eucalyptus Rest API.
 *
 */

const API = (APIConf: LMSBackend | AuthenticationBackend): ApiImplementation => {
  const ApiOptions = {
    routes: {
      user: {
        me: '/api/mobile/v0.5/my_user_info',
      },
    },
  };

  return OpenEdxHawthornApiInterface(APIConf, ApiOptions);
};

export default API;
