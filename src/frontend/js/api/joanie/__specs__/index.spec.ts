import fetchMock from 'fetch-mock';
import * as mockFactories from 'utils/test/factories';
import { RICHIE_USER_TOKEN } from 'settings';

import { joanieApi } from '..';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      joanie_backend: { endpoint: 'https://joanie.endpoint' },
    })
    .generate(),
}));

describe('joanieApi', () => {
  it('test', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/addressId/', []);
    await joanieApi.addresses.addressesRead('addressId');

    let lastCall = fetchMock.lastCall();
    const visitorHeader = lastCall && lastCall[1]?.headers;
    // TS see visitorHeader has HeadersInit instead of Headers and
    // didn't accept get() as a possible function.
    // @ts-ignore
    expect(visitorHeader?.get('Authorization')).toBeNull();

    sessionStorage.setItem(RICHIE_USER_TOKEN, 'TEST_TOKEN');
    await joanieApi.addresses.addressesRead('addressId');
    lastCall = fetchMock.lastCall();
    const userHeader = lastCall && lastCall[1]?.headers;
    // @ts-ignore
    expect(userHeader?.get('Authorization')).toBe('Bearer TEST_TOKEN');
  });
});
