import { AuthenticationBackend, LMSBackend } from 'types/commonDataProps';
import { APILms } from 'types/api';
import OpenEdxHawthornApiInterface from './openedx-hawthorn';

/**
 *
 * OpenEdX Dogwood API Implementation
 *
 * This implementation inherits from Hawthorn implementation.
 * The `user.me` method has to be overriden since `/user/v1/me` route does not
 * exist in OpenEdX Dogwood & Eucalyptus Rest API.
 *
 */

const API = (APIConf: AuthenticationBackend | LMSBackend): APILms => {
  const APIOptions = {
    routes: {
      user: {
        me: `${APIConf.endpoint}/api/mobile/v0.5/my_user_info`,
      },
    },
  };

  return OpenEdxHawthornApiInterface(APIConf, APIOptions);
};

export default API;
