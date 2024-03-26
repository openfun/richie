import Cookies from 'js-cookie';
import { AuthenticationBackend, LMSBackend } from 'types/commonDataProps';
import { APILms } from 'types/api';
import { EDX_CSRF_TOKEN_COOKIE_NAME, RICHIE_USER_TOKEN } from 'settings';
import { HttpError, HttpStatusCode } from 'utils/errors/HttpError';
import { handle } from 'utils/errors/handle';
import { OpenEdxApiProfile } from 'types/openEdx';
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
      setCsrfToken: `${APIConf.endpoint}/api/enrollment/v1/enrollment`,
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
          const accountResponse = await fetch(
            APIOptions.routes.user.account.replace(':username', username),
            options,
          );
          const preferencesResponse = await fetch(
            APIOptions.routes.user.preferences.replace(':username', username),
            options,
          );

          const isResponseOk = accountResponse.ok && preferencesResponse.ok;
          if (isResponseOk) {
            const account = await accountResponse.json();
            const preferences = await preferencesResponse.json();
            return {
              ...account,
              ...preferences,
            } as unknown as OpenEdxApiProfile;
          }

          const isAccountResponseError =
            accountResponse.status >= HttpStatusCode.INTERNAL_SERVER_ERROR;
          if (isAccountResponseError) {
            handle(
              new Error(
                `[GET - Account] > ${accountResponse.status} - ${accountResponse.statusText}`,
              ),
            );
          }
          const isPreferencesResponseError =
            accountResponse.status >= HttpStatusCode.INTERNAL_SERVER_ERROR;
          if (isPreferencesResponseError) {
            handle(
              new Error(
                `[GET - Account] > ${preferencesResponse.status} - ${preferencesResponse.statusText}`,
              ),
            );
          }
          const responseError = isAccountResponseError ? accountResponse : preferencesResponse;

          throw new HttpError(responseError.status, responseError.statusText);
        },
        update: async (username: string, data: OpenEdxFullNameFormValues) => {
          /*
            edx_csrf_token cookie is set through a SET_COOKIE header send from a previous request
            e.g: Getting user enrollment set the cookie
          */
          // Ensure CSRF is fresh
          await fetch(APIOptions.routes.setCsrfToken, { credentials: 'include' });
          const csrfToken = Cookies.get(EDX_CSRF_TOKEN_COOKIE_NAME) || '';
          return fetch(APIOptions.routes.user.account.replace(':username', username), {
            method: 'PATCH',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/merge-patch+json',
              'X-CSRFTOKEN': csrfToken,
            },
            body: JSON.stringify(data),
          }).then((response) => {
            if (response.ok) return response.json();
            if (response.status >= HttpStatusCode.INTERNAL_SERVER_ERROR) {
              handle(new Error(`[PATCH - Account] > ${response.status} - ${response.statusText}`));
            }
            throw new HttpError(response.status, response.statusText);
          });
        },
      },
    },
  };
};

export default API;
