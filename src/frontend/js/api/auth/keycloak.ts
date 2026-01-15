import Keycloak from 'keycloak-js';
import { AuthenticationBackend } from 'types/commonDataProps';
import { APIAuthentication } from 'types/api';
import { location } from 'utils/indirection/window';
import { handle } from 'utils/errors/handle';

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
      me: async () => {
        return keycloak
          .loadUserProfile()
          .then((userProfile) => {
            return {
              username: `${userProfile.firstName} ${userProfile.lastName}`,
              email: userProfile.email,
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
        await keycloak.logout({ redirectUri: getRedirectUri() });
      },
    },
  };
};

export default API;
