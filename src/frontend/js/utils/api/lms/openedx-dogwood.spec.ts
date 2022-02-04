import fetchMock from 'fetch-mock';
import OpenEdxDogwoodAPIInterface from './openedx-dogwood';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: null,
}));

describe('OpenEdX Dogwood API', () => {
  const configuration = {
    backend: 'openedx-dogwood',
    course_regexp: '.*',
    endpoint: 'https://demo.endpoint.api',
  };

  beforeEach(() => {
    fetchMock.restore();
  });

  it('uses its own route to get user information', async () => {
    fetchMock.get('https://demo.endpoint.api/api/mobile/v0.5/my_user_info', {
      username: 'r.cunningham',
    });

    const api = OpenEdxDogwoodAPIInterface(configuration);
    await expect(api.user.me()).resolves.toEqual({ username: 'r.cunningham' });
  });
});
