import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { act, render, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { PropsWithChildren } from 'react';
import { ContextFactory as mockContextFactory, FonzieUserFactory } from 'utils/test/factories';
import createQueryClient from 'utils/react-query/createQueryClient';
import { Deferred } from 'utils/test/deferred';
import { REACT_QUERY_SETTINGS, RICHIE_USER_TOKEN } from 'settings';
import { useSession } from 'data/SessionProvider/index';
import JoanieSessionProvider from './JoanieSessionProvider';

jest.mock('utils/errors/handle');
jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint.test' },
  }).generate(),
}));
jest.mock('utils/indirection/window', () => ({
  location: {
    assign: jest.fn(),
  },
}));

// - Joanie Session Provider test suite
describe('JoanieSessionProvider', () => {
  const Wrapper = ({ client, children }: PropsWithChildren<{ client: QueryClient }>) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={client}>
        <JoanieSessionProvider>{children}</JoanieSessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );

  beforeEach(() => {
    fetchMock.restore();
    jest.useFakeTimers();
    sessionStorage.clear();

    fetchMock
      .get('https://joanie.endpoint.test/api/addresses/', [])
      .get('https://joanie.endpoint.test/api/credit-cards/', [])
      .get('https://joanie.endpoint.test/api/orders/', []);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('stores user access token within session storage', async () => {
    const queryClient = createQueryClient();
    const user = FonzieUserFactory.generate();

    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', user);

    render(<Wrapper client={queryClient} />);

    await waitFor(() => {
      expect(fetchMock.lastUrl()).toEqual('https://auth.endpoint.test/api/v1.0/user/me');
    });

    expect(sessionStorage.getItem(RICHIE_USER_TOKEN)).toEqual(user.access_token);
  });

  it('prefetches addresses, credit-cards and order when user is authenticated', async () => {
    const queryClient = createQueryClient();
    const user = FonzieUserFactory.generate();
    const deferredUser = new Deferred();

    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', deferredUser.promise);

    render(<Wrapper client={queryClient} />);

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

    render(<Wrapper client={queryClient} />);

    await act(async () => deferredUser.resolve(null));

    expect(fetchMock.lastUrl()).toEqual('https://auth.endpoint.test/api/v1.0/user/me');

    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastUrl()).toEqual('https://auth.endpoint.test/api/v1.0/user/me');
  });

  it('clears session storage on login', async () => {
    const queryClient = createQueryClient({ persistor: true });
    const user = FonzieUserFactory.generate();
    const userDeferred = new Deferred();

    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', userDeferred.promise);
    const { result, rerender } = renderHook(useSession, {
      wrapper: Wrapper,
      initialProps: { client: queryClient },
    });

    await act(async () => {
      userDeferred.resolve(user);
    });

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(result.current.user).toStrictEqual(user);
    expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key)).toContain(user.username);
    expect(sessionStorage.getItem(RICHIE_USER_TOKEN)).toEqual(user.access_token);

    await act(async () => {
      result.current.login();
    });

    expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key)).toBeNull();
    expect(sessionStorage.getItem(RICHIE_USER_TOKEN)).toBeNull();

    rerender();
    expect(result.current.user).toBeUndefined();
  });

  it('clears session storage on register', async () => {
    const queryClient = createQueryClient({ persistor: true });
    const user = FonzieUserFactory.generate();
    const userDeferred = new Deferred();

    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', userDeferred.promise);
    const { result, rerender } = renderHook(useSession, {
      wrapper: Wrapper,
      initialProps: { client: queryClient },
    });

    await act(async () => {
      userDeferred.resolve(user);
    });

    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    expect(result.current.user).toStrictEqual(user);
    expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key)).toContain(user.username);
    expect(sessionStorage.getItem(RICHIE_USER_TOKEN)).toEqual(user.access_token);

    await act(async () => {
      result.current.register();
    });

    expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key)).toBeNull();
    expect(sessionStorage.getItem(RICHIE_USER_TOKEN)).toBeNull();

    rerender();
    expect(result.current.user).toBeUndefined();
  });
});
