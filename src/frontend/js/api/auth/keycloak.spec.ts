import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import API from './keycloak';

const mockKeycloakInit = jest.fn().mockResolvedValue(true);
const mockKeycloakLogout = jest.fn().mockResolvedValue(undefined);
const mockKeycloakLogin = jest.fn().mockResolvedValue(undefined);
const mockKeycloakLoadUserProfile = jest.fn();

jest.mock('keycloak-js', () => {
  return jest.fn().mockImplementation(() => ({
    init: mockKeycloakInit,
    logout: mockKeycloakLogout,
    login: mockKeycloakLogin,
    loadUserProfile: mockKeycloakLoadUserProfile,
  }));
});

jest.mock('utils/indirection/window', () => ({
  location: {
    origin: 'https://richie.test',
    pathname: '/courses/test-course/',
  },
}));

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: {
      backend: 'keycloak',
      endpoint: 'https://keycloak.test/auth',
      client_id: 'richie-client',
      realm: 'richie-realm',
      auth_url: 'https://keycloak.test/auth/realms/richie-realm/protocol/openid-connect/auth',
    },
  }).one(),
}));

describe('Keycloak API', () => {
  const authConfig = {
    backend: 'keycloak',
    endpoint: 'https://keycloak.test/auth',
    client_id: 'richie-client',
    realm: 'richie-realm',
    auth_url: 'https://keycloak.test/auth/realms/richie-realm/protocol/openid-connect/auth',
    registration_url: 'https://keycloak.test/auth/realms/richie-realm/protocol/openid-connect/registrations',
  };

  let keycloakApi: ReturnType<typeof API>;

  beforeEach(() => {
    jest.clearAllMocks();
    keycloakApi = API(authConfig);
  });

  describe('user.me', () => {
    it('returns null when loadUserProfile fails', async () => {
      mockKeycloakLoadUserProfile.mockRejectedValueOnce(new Error('Not authenticated'));
      const response = await keycloakApi.user.me();
      expect(response).toBeNull();
    });

    it('returns user when loadUserProfile succeeds', async () => {
      mockKeycloakLoadUserProfile.mockResolvedValueOnce({
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com',
      });

      const response = await keycloakApi.user.me();
      expect(response).toEqual({
        username: 'John Doe',
        email: 'johndoe@example.com',
      });
    });
  });

  describe('user.login', () => {
    it('calls keycloak.login with correct redirect URI', async () => {
      await keycloakApi.user.login();

      expect(mockKeycloakLogin).toHaveBeenCalledWith({
        redirectUri: 'https://richie.test/courses/test-course/',
      });
    });
  });

  describe('user.register', () => {
    it('calls keycloak.login with register action', async () => {
      await keycloakApi.user.register();

      expect(mockKeycloakLogin).toHaveBeenCalledWith({
        redirectUri: 'https://richie.test/courses/test-course/',
        action: 'REGISTER',
      });
    });
  });

  describe('user.logout', () => {
    it('calls keycloak.logout with correct redirect URI', async () => {
      await keycloakApi.user.logout();

      expect(mockKeycloakLogout).toHaveBeenCalledWith({
        redirectUri: 'https://richie.test/courses/test-course/',
      });
    });
  });

  describe('Keycloak initialization', () => {
    it('initializes keycloak with correct configuration', () => {
      const Keycloak = require('keycloak-js');

      expect(Keycloak).toHaveBeenCalledWith({
        url: 'https://keycloak.test/auth',
        realm: 'richie-realm',
        clientId: 'richie-client',
      });

      expect(mockKeycloakInit).toHaveBeenCalledWith({
        checkLoginIframe: false,
        flow: 'implicit',
        token: undefined,
      });
    });
  });
});
