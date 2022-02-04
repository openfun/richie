import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';
import { act, render, waitFor } from '@testing-library/react';
import { ContextFactory as mockContextFactory, FonzieUserFactory } from 'utils/test/factories';
import createQueryClient from 'utils/react-query/createQueryClient';
import { Deferred } from 'utils/test/deferred';
import { RICHIE_USER_TOKEN } from 'settings';
import JoanieSessionProvider from './JoanieSessionProvider';

jest.mock('utils/errors/handle');
jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint.test' },
  }).generate(),
}));

// - Joanie Session Provider test suite
describe('JoanieSessionProvider', () => {
  beforeEach(() => {
    fetchMock.restore();
  });

  it('stores user access token within session storage', async () => {
    const queryClient = createQueryClient();
    const user = FonzieUserFactory.generate();

    fetchMock
      .get('https://auth.endpoint.test/api/v1.0/user/me', user)
      .get('https://joanie.endpoint.test/api/addresses/', [])
      .get('https://joanie.endpoint.test/api/credit-cards/', [])
      .get('https://joanie.endpoint.test/api/orders/', []);

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <JoanieSessionProvider />
        </QueryClientProvider>
      </IntlProvider>,
    );

    await waitFor(() => {
      expect(fetchMock.lastUrl()).toEqual('https://auth.endpoint.test/api/v1.0/user/me');
    });

    expect(sessionStorage.getItem(RICHIE_USER_TOKEN)).toEqual(user.access_token);
  });

  it('prefetches addresses, credit-cards and order when user is authenticated', async () => {
    const queryClient = createQueryClient();
    const user = FonzieUserFactory.generate();
    const deferredUser = new Deferred();

    fetchMock
      .get('https://auth.endpoint.test/api/v1.0/user/me', deferredUser.promise)
      .get('https://joanie.endpoint.test/api/addresses/', [])
      .get('https://joanie.endpoint.test/api/credit-cards/', [])
      .get('https://joanie.endpoint.test/api/orders/', []);

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <JoanieSessionProvider />
        </QueryClientProvider>
      </IntlProvider>,
    );

    await act(async () => deferredUser.resolve(user));

    const calls = fetchMock.calls();
    expect(calls).toHaveLength(4);
    expect(calls[0][0]).toEqual('https://auth.endpoint.test/api/v1.0/user/me');
    expect(calls[1][0]).toEqual('https://joanie.endpoint.test/api/addresses/');
    expect(calls[2][0]).toEqual('https://joanie.endpoint.test/api/credit-cards/');
    expect(calls[3][0]).toEqual('https://joanie.endpoint.test/api/orders/');
  });

  it('does not prefetch address, credit-cards, and order when user is anonymous', async () => {
    const queryClient = createQueryClient();
    const deferredUser = new Deferred();

    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', deferredUser.promise);

    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={queryClient}>
          <JoanieSessionProvider />
        </QueryClientProvider>
      </IntlProvider>,
    );

    await act(async () => deferredUser.resolve(null));

    expect(fetchMock.lastUrl()).toEqual('https://auth.endpoint.test/api/v1.0/user/me');

    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastUrl()).toEqual('https://auth.endpoint.test/api/v1.0/user/me');
  });
});
