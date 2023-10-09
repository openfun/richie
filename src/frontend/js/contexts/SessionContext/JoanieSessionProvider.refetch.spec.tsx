import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { faker } from '@faker-js/faker';
import {
  RichieContextFactory as mockRichieContextFactory,
  FonzieUserFactory,
} from 'utils/test/factories/richie';
import { RICHIE_USER_TOKEN } from 'settings';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieSessionProvider from './JoanieSessionProvider';

jest.mock('utils/errors/handle');
jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint.test' },
  }).one(),
}));
jest.mock('utils/test/isTestEnv', () => ({
  __esModule: true,
  default: false,
}));

// - Joanie Session Provider test suite
describe('JoanieSessionProvider', () => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ persister: true })}>
        <JoanieSessionProvider>{children}</JoanieSessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );

  beforeEach(() => {
    fetchMock.restore();
    jest.useFakeTimers();
    sessionStorage.clear();

    fetchMock
      .get('https://joanie.endpoint.test/api/v1.0/addresses/', [])
      .get('https://joanie.endpoint.test/api/v1.0/credit-cards/', [])
      .get('https://joanie.endpoint.test/api/v1.0/orders/', []);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('does refetch address, credit-cards, and order when user token change', async () => {
    const initialAccessToken = btoa(faker.string.uuid());
    const user = FonzieUserFactory({ access_token: initialAccessToken }).one();
    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', user);
    render(<Wrapper />);

    await waitFor(async () => {
      const apiCallUrls = fetchMock.calls().map((call) => call[0]);
      expect(apiCallUrls).toContain('https://joanie.endpoint.test/api/v1.0/addresses/');
    });
    expect(fetchMock.lastUrl()).not.toEqual('https://auth.endpoint.test/api/v1.0/user/me');

    const addressCall = fetchMock
      .calls()
      .find((call) => call[0] === 'https://joanie.endpoint.test/api/v1.0/addresses/');

    const { headers } = addressCall![1]!;

    // @ts-ignore
    expect(headers!.Authorization).toBe(`Bearer ${initialAccessToken}`);

    // Api token refresh
    const newAccessToken = btoa(faker.string.uuid());
    user.access_token = newAccessToken;

    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', user, { overwriteRoutes: true });
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    await waitFor(() => {
      expect(fetchMock.lastUrl()).toEqual('https://auth.endpoint.test/api/v1.0/user/me');
    });
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    await waitFor(async () => {
      expect(sessionStorage.getItem(RICHIE_USER_TOKEN)).toEqual(newAccessToken);
    });

    const allAddressCalls = fetchMock
      .calls()
      .filter((call) => call[0] === 'https://joanie.endpoint.test/api/v1.0/addresses/');
    expect(allAddressCalls).toHaveLength(2);

    const newAddressCall = allAddressCalls.reverse()[0];
    const { headers: newHeaders } = newAddressCall![1]!!;

    // @ts-ignore
    expect(newHeaders!.Authorization).toBe(`Bearer ${newAccessToken}`);
  });
});
