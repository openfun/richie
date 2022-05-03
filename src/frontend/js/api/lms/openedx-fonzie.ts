import { AuthenticationBackend, LMSBackend } from 'types/commonDataProps';
import { APILms } from 'types/api';
import { RICHIE_USER_TOKEN } from 'settings';
import OpenEdxHawthornApiInterface from './openedx-hawthorn';

/**
 *
 * OpenEdX completed by Fonzie API Implementation
 *
 * This implementation inherits from Hawthorn implementation.
 * The `user.me` method has to be overriden to retrieve user information from
 * fonzie API to retrieve a JWT Token
 *
 * A method `accessToken` has been added to retrieve the access_token
 * stored in the persisted client by react query within SessionStorage.
 *
 * Related resources:
 * https://github.com/openfun/fonzie/pull/24
 *
 */

const API = (APIConf: AuthenticationBackend | LMSBackend): APILms => {
  const APIOptions = {
    routes: {
      user: {
        me: `${APIConf.endpoint}/api/v1.0/user/me`,
      },
    },
  };

  const ApiInterface = OpenEdxHawthornApiInterface(APIConf, APIOptions);
  return {
    ...ApiInterface,
    user: {
      ...ApiInterface.user,
      accessToken: () => {
        return sessionStorage.getItem(RICHIE_USER_TOKEN);
      },
    },
  };
};

export default API;
