import fetchMock from 'fetch-mock';
import { RICHIE_USER_TOKEN } from 'settings';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { getApiClientJoanie } from './client';
import { ApiClientJoanie } from './gen';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('joanieApi', () => {
  let joanieApi: ApiClientJoanie;
  beforeEach(() => {
    joanieApi = getApiClientJoanie();
  });

  it('test', async () => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/FAKE_ADDRESS_ID/', []);
    await joanieApi.addresses.addressesRetrieve('FAKE_ADDRESS_ID');

    let lastCall = fetchMock.lastCall();
    const visitorHeader = lastCall && lastCall[1]?.headers;
    // TS see visitorHeader has HeadersInit instead of Headers and
    // didn't accept get() as a possible function.
    // @ts-ignore
    expect(visitorHeader?.get('Authorization')).toBeNull();

    sessionStorage.setItem(RICHIE_USER_TOKEN, 'TEST_TOKEN');
    await joanieApi.addresses.addressesRetrieve('FAKE_ADDRESS_ID');
    lastCall = fetchMock.lastCall();
    const userHeader = lastCall && lastCall[1]?.headers;
    // @ts-ignore
    expect(userHeader?.get('Authorization')).toBe('Bearer TEST_TOKEN');
  });
});
