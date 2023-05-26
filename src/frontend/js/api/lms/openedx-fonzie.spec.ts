import { faker } from '@faker-js/faker';
import fetchMock from 'fetch-mock';
import { RICHIE_USER_TOKEN } from 'settings';
import FonzieAPIInterface from './openedx-fonzie';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: null,
}));

describe('Fonzie API', () => {
  const configuration = {
    backend: 'openedx-dogwood',
    course_regexp: '.*',
    endpoint: 'https://demo.endpoint.api',
  };

  beforeEach(() => {
    fetchMock.restore();
  });

  it('uses its own route to get user information', async () => {
    const user = {
      username: faker.internet.userName(),
    };

    fetchMock.get('https://demo.endpoint.api/api/v1.0/user/me', user);

    const api = FonzieAPIInterface(configuration);
    await expect(api.user.me()).resolves.toEqual(user);
  });

  it('is able to retrieve access token within the session storage', () => {
    const accessToken = faker.string.uuid();
    sessionStorage.setItem(RICHIE_USER_TOKEN, accessToken);

    const api = FonzieAPIInterface(configuration);
    expect(api.user.accessToken).not.toBeUndefined();

    const token = api.user.accessToken!();
    expect(token).toEqual(accessToken);
  });
});
