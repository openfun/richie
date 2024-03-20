import Cookies from 'js-cookie';
import { AuthenticationBackend, LMSBackend } from 'types/commonDataProps';
import { APILms } from 'types/api';
import { RICHIE_USER_TOKEN, EDX_CSRF_TOKEN_COOKIE_NAME } from 'settings';
import { isHttpError } from 'utils/errors/HttpError';
import { handle } from 'utils/errors/handle';
import { OpenEdxApiProfile } from 'types/openEdx';
import { checkStatus } from 'api/utils';
import { OpenEdxFullNameFormValues } from 'components/OpenEdxFullNameForm';
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
        account: `${APIConf.endpoint}/api/user/v1/accounts/:username`,
        preferences: `${APIConf.endpoint}/api/user/v1/preferences/:username`,
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
      account: {
        get: async (username: string) => {
          const options: RequestInit = {
            credentials: 'include',
          };

          try {
            const account = await fetch(
              APIOptions.routes.user.account.replace(':username', username),
              options,
            ).then(checkStatus);
            const preferences = await fetch(
              APIOptions.routes.user.preferences.replace(':username', username),
              options,
            ).then(checkStatus);

            return {
              ...account,
              ...preferences,
            } as OpenEdxApiProfile;
          } catch (e) {
            if (isHttpError(e)) {
              handle(new Error(`[GET - Account] > ${e.code} - ${e.message}`));
            }

            throw e;
          }
        },
        update: async (username: string, data: OpenEdxFullNameFormValues) => {
          const csrfToken = Cookies.get(EDX_CSRF_TOKEN_COOKIE_NAME) || '';
          try {
            return await fetch(APIOptions.routes.user.account.replace(':username', username), {
              method: 'PATCH',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/merge-patch+json',
                'X-CSRFTOKEN': csrfToken,
              },
              body: JSON.stringify(data),
            }).then(checkStatus);
          } catch (e) {
            if (isHttpError(e)) {
              handle(new Error(`[POST - Account] > ${e.code} - ${e.message}`));
            }

            throw e;
          }
        },
      },
    },
  };
};

export default API;
