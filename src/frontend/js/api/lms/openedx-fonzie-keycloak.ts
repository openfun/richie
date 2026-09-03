import Cookies from 'js-cookie';
import { AuthenticationBackend } from 'types/commonDataProps';
import { APILms } from 'types/api';
import { RICHIE_USER_TOKEN, EDX_CSRF_TOKEN_COOKIE_NAME } from 'settings';
import { isHttpError } from 'utils/errors/HttpError';
import { handle } from 'utils/errors/handle';
import { OpenEdxApiProfile } from 'types/openEdx';
import { checkStatus } from 'api/utils';
import { OpenEdxFullNameFormValues } from 'components/OpenEdxFullNameForm';
import { location } from 'utils/indirection/window';
import { base64Decode } from 'utils/base64Parser';
import { Maybe } from 'types/utils';
import OpenEdxHawthornApiInterface from './openedx-hawthorn';

/**
 * Extract claims from the JWT issued by Fonzie. The `user/me` route does not expose
 * the email nor an up to date full name, but the token it returns always carries them.
 */
const getTokenClaims = (token: Maybe<string>): Maybe<{ email?: string; full_name?: string }> => {
  if (!token) return undefined;

  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(base64Decode(payload));
  } catch {
    return undefined;
  }
};

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

const API = (APIConf: AuthenticationBackend): APILms => {
  const APIOptions = {
    routes: {
      user: {
        login: `${APIConf.endpoint}/keycloak-login`,
        me: `${APIConf.endpoint}/api/v1.0/user/me`,
        account: `${APIConf.keycloak_endpoint}/realms/${APIConf.keycloak_realm}/account/`,
        preferences: `${APIConf.endpoint}/api/user/v1/preferences/:username`,
      },
    },
  };

  const ApiInterface = OpenEdxHawthornApiInterface(APIConf, APIOptions);
  return {
    ...ApiInterface,
    user: {
      ...ApiInterface.user,
      me: async () => {
        const user = await ApiInterface.user.me();
        if (!user) return null;

        const claims = getTokenClaims(user.access_token);
        return {
          ...user,
          full_name: user.full_name || claims?.full_name,
          email: user.email ?? claims?.email,
        };
      },
      login: () => {
        const next = encodeURIComponent(location.href);
        location.assign(`${APIOptions.routes.user.login}?next=${next}`);
      },
      accessToken: () => {
        return sessionStorage.getItem(RICHIE_USER_TOKEN);
      },
      account: {
        updateUrl: () => APIOptions.routes.user.account,
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
