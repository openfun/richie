import Keycloak from 'keycloak-js';
import { AuthenticationBackend } from 'types/commonDataProps';
import { APIAuthentication } from 'types/api';
import { location } from 'utils/indirection/window';
import { handle } from 'utils/errors/handle';
import { RICHIE_USER_TOKEN } from 'settings';

const API = (APIConf: AuthenticationBackend): { user: APIAuthentication } => {
  const keycloak = new Keycloak({
    url: APIConf.endpoint,
    realm: APIConf.realm!,
    clientId: APIConf.client_id!,
  });
  keycloak.init({
    checkLoginIframe: false,
    flow: 'implicit',
    token: APIConf.token!,
  });

  const getRedirectUri = () => {
    return `${location.origin}${location.pathname}`;
  };

  return {
    user: {
      accessToken: () => sessionStorage.getItem(RICHIE_USER_TOKEN),
      me: async () => {
        return keycloak
          .loadUserProfile()
          .then((userProfile) => {
            sessionStorage.setItem(RICHIE_USER_TOKEN, keycloak.idToken!);
            return {
              username: `${userProfile.firstName} ${userProfile.lastName}`,
              email: userProfile.email,
              access_token: keycloak.idToken,
            };
          })
          .catch((error) => {
            handle(error);
            return null;
          });
      },

      login: async () => {
        await keycloak.login({ redirectUri: getRedirectUri() });
      },

      register: async () => {
        await keycloak.login({ redirectUri: getRedirectUri(), action: 'REGISTER' });
      },

      logout: async () => {
        sessionStorage.removeItem(RICHIE_USER_TOKEN);
        await keycloak.logout({ redirectUri: getRedirectUri() });
      },
    },
  };
};

export default API;
