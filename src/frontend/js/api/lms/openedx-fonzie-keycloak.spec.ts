import { faker } from '@faker-js/faker';
import fetchMock from 'fetch-mock';
import { RICHIE_USER_TOKEN } from 'settings';
import { OpenEdxApiProfileFactory } from 'utils/test/factories/openEdx';
import { location } from 'utils/indirection/window';
import FonzieKeycloakAPIInterface from './openedx-fonzie-keycloak';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: null,
}));

jest.mock('utils/indirection/window', () => ({
  location: {
    href: 'http://localhost/',
    assign: jest.fn(),
  },
}));

describe('Fonzie Keycloak API', () => {
  const configuration = {
    backend: 'fonzie-keycloak',
    course_regexp: '.*',
    endpoint: 'https://demo.endpoint.api',
    keycloak_endpoint: 'https://keycloak.test/auth',
    keycloak_realm: 'richie-realm',
  };

  beforeEach(() => {
    fetchMock.restore();
    jest.clearAllMocks();
  });

  it('uses its own route to get user information', async () => {
    const user = {
      username: faker.internet.username(),
    };

    fetchMock.get('https://demo.endpoint.api/api/v1.0/user/me', user);

    const api = FonzieKeycloakAPIInterface(configuration);
    await expect(api.user.me()).resolves.toEqual(user);
  });

  it('redirects to keycloak-login endpoint on login', () => {
    const api = FonzieKeycloakAPIInterface(configuration);
    api.user.login!();

    expect(location.assign).toHaveBeenCalledWith(
      `https://demo.endpoint.api/keycloak-login?next=${encodeURIComponent('http://localhost/')}`,
    );
  });

  it('uses keycloak account URL to get user profile', async () => {
    const openEdxApiProfile = OpenEdxApiProfileFactory().one();
    const { 'pref-lang': language, ...account } = openEdxApiProfile;

    fetchMock.get('https://keycloak.test/auth/realms/richie-realm/account/', account);
    fetchMock.get(
      `https://demo.endpoint.api/api/user/v1/preferences/${openEdxApiProfile.username}`,
      { 'pref-lang': language },
    );

    const api = FonzieKeycloakAPIInterface(configuration);
    expect(await api.user.account!.get(openEdxApiProfile.username)).toEqual(openEdxApiProfile);
    expect(fetchMock.calls()).toHaveLength(2);
  });

  it('is able to retrieve access token within the session storage', () => {
    const accessToken = faker.string.uuid();
    sessionStorage.setItem(RICHIE_USER_TOKEN, accessToken);

    const api = FonzieKeycloakAPIInterface(configuration);
    expect(api.user.accessToken).not.toBeUndefined();

    const token = api.user.accessToken!();
    expect(token).toEqual(accessToken);
  });
});
