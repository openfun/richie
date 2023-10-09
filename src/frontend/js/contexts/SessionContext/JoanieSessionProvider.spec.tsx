import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import {
  RichieContextFactory as mockRichieContextFactory,
  FonzieUserFactory,
} from 'utils/test/factories/richie';
import { Deferred } from 'utils/test/deferred';
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

  it('stores user access token within session storage', async () => {
    const user = FonzieUserFactory().one();
    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', user);

    render(<Wrapper />);

    await waitFor(async () => {
      expect(fetchMock.lastUrl()).toEqual('https://auth.endpoint.test/api/v1.0/user/me');
    });
    await waitFor(async () =>
      expect(sessionStorage.getItem(RICHIE_USER_TOKEN)).toEqual(user.access_token),
    );
  });

  it('prefetches addresses, credit-cards and order when user is authenticated', async () => {
    const user = FonzieUserFactory().one();
    const deferredUser = new Deferred();

    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', deferredUser.promise);

    render(<Wrapper />);

    await act(async () => deferredUser.resolve(user));

    await waitFor(async () => {
      const apiCallUrls = fetchMock.calls().map((call) => call[0]);
      expect(apiCallUrls).toHaveLength(4);
      expect(apiCallUrls).toContain('https://auth.endpoint.test/api/v1.0/user/me');
      expect(apiCallUrls).toContain('https://joanie.endpoint.test/api/v1.0/addresses/');
      expect(apiCallUrls).toContain('https://joanie.endpoint.test/api/v1.0/credit-cards/');
      expect(apiCallUrls).toContain('https://joanie.endpoint.test/api/v1.0/orders/');
    });
  });

  it('does not prefetch address, credit-cards, and order when user is anonymous', async () => {
    const deferredUser = new Deferred();

    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', deferredUser.promise);

    render(<Wrapper />);

    await act(async () => deferredUser.resolve(null));

    await waitFor(async () =>
      expect(fetchMock.lastUrl()).toEqual('https://auth.endpoint.test/api/v1.0/user/me'),
    );

    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastUrl()).toEqual('https://auth.endpoint.test/api/v1.0/user/me');
  });
});
