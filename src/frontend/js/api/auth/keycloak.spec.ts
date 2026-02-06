import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { KeycloakAccountApi } from 'types/api';
import API from './keycloak';

const mockKeycloakInit = jest.fn().mockResolvedValue(true);
const mockKeycloakLogout = jest.fn().mockResolvedValue(undefined);
const mockKeycloakLogin = jest.fn().mockResolvedValue(undefined);
const mockKeycloakLoadUserProfile = jest.fn();
const mockKeycloakUpdateToken = jest.fn().mockResolvedValue(true);
const mockKeycloakCreateAccountUrl = jest
  .fn()
  .mockReturnValue('https://keycloak.test/auth/realms/richie-realm/account');
const mockIdToken = 'mock-id-token-12345';
const mockIdTokenParsed = {
  preferred_username: 'johndoe',
  firstName: 'John',
  lastName: 'Doe',
  email: 'johndoe@example.com',
};

jest.mock('keycloak-js', () => {
  return jest.fn().mockImplementation(() => ({
    init: mockKeycloakInit,
    logout: mockKeycloakLogout,
    login: mockKeycloakLogin,
    loadUserProfile: mockKeycloakLoadUserProfile,
    updateToken: mockKeycloakUpdateToken,
    createAccountUrl: mockKeycloakCreateAccountUrl,
    idToken: mockIdToken,
    idTokenParsed: mockIdTokenParsed,
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
    registration_url:
      'https://keycloak.test/auth/realms/richie-realm/protocol/openid-connect/registrations',
  };

  let keycloakApi: ReturnType<typeof API>;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    keycloakApi = API(authConfig);
  });

  describe('user.accessToken', () => {
    it('returns null when no token is stored', () => {
      const token = keycloakApi.user.accessToken!();
      expect(token).toBeNull();
    });

    it('returns the token from sessionStorage', () => {
      sessionStorage.setItem('RICHIE_USER_TOKEN', mockIdToken);
      const token = keycloakApi.user.accessToken!();
      expect(token).toEqual(mockIdToken);
    });
  });

  describe('user.me', () => {
    it('returns null when updateToken fails', async () => {
      mockKeycloakUpdateToken.mockRejectedValueOnce(new Error('Token refresh failed'));
      const response = await keycloakApi.user.me();
      expect(response).toBeNull();
      expect(mockKeycloakLoadUserProfile).not.toHaveBeenCalled();
    });

    it('returns null when loadUserProfile fails', async () => {
      mockKeycloakUpdateToken.mockResolvedValueOnce(true);
      mockKeycloakLoadUserProfile.mockRejectedValueOnce(new Error('Not authenticated'));
      const response = await keycloakApi.user.me();
      expect(response).toBeNull();
    });

    it('returns user when loadUserProfile succeeds', async () => {
      mockKeycloakUpdateToken.mockResolvedValueOnce(true);
      mockKeycloakLoadUserProfile.mockResolvedValueOnce({
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com',
      });

      const response = await keycloakApi.user.me();
      expect(mockKeycloakUpdateToken).toHaveBeenCalledWith(30);
      expect(response).toEqual({
        username: 'John Doe',
        email: 'johndoe@example.com',
        access_token: mockIdToken,
      });
      expect(sessionStorage.getItem('RICHIE_USER_TOKEN')).toEqual(mockIdToken);
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

  describe('user.account', () => {
    it('returns profile data from idTokenParsed via account.get()', () => {
      const profile = (keycloakApi.user.account as KeycloakAccountApi).get();
      expect(profile).toEqual({
        username: 'johndoe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com',
      });
    });

    it('returns the account management URL via account.updateUrl()', () => {
      const url = (keycloakApi.user.account as any).updateUrl();
      expect(url).toBe('https://keycloak.test/auth/realms/richie-realm/account');
      expect(mockKeycloakCreateAccountUrl).toHaveBeenCalled();
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
        flow: 'standard',
        onLoad: 'check-sso',
        pkceMethod: 'S256',
      });
    });
  });
});
