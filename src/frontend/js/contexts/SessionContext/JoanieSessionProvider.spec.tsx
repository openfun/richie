import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import {
  RichieContextFactory as mockRichieContextFactory,
  FonzieUserFactory,
} from 'utils/test/factories/richie';
import { Deferred } from 'utils/test/deferred';
import { REACT_QUERY_SETTINGS, RICHIE_USER_TOKEN } from 'settings';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { HttpStatusCode } from 'utils/errors/HttpError';
import JoanieSessionProvider from './JoanieSessionProvider';
import { useSession } from '.';

jest.mock('utils/errors/handle');
jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint.test' },
  }).one(),
}));
jest.mock('utils/indirection/window', () => ({
  location: {
    assign: jest.fn(),
  },
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

    await act(async () => {
      render(<Wrapper />);
    });
    await waitFor(async () => {
      expect(fetchMock.lastUrl()).toEqual('https://auth.endpoint.test/api/v1.0/user/me');
    });
    await waitFor(async () =>
      expect(sessionStorage.getItem(RICHIE_USER_TOKEN)).toEqual(user.access_token),
    );
  });

  it('removes user access token within session storage on error', async () => {
    sessionStorage.setItem(RICHIE_USER_TOKEN, 'richie');
    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', HttpStatusCode.FORBIDDEN);

    await act(async () => {
      render(<Wrapper />);
    });
    await waitFor(async () => {
      expect(fetchMock.lastUrl()).toEqual('https://auth.endpoint.test/api/v1.0/user/me');
    });
    await waitFor(async () => expect(sessionStorage.getItem(RICHIE_USER_TOKEN)).toBeNull());
  });

  it('prefetches addresses, credit-cards and order when user is authenticated', async () => {
    const user = FonzieUserFactory().one();
    const deferredUser = new Deferred();

    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', deferredUser.promise);

    await act(async () => {
      render(<Wrapper />);
    });

    await act(async () => deferredUser.resolve(user));

    await waitFor(async () => {
      const calls = fetchMock.calls();
      expect(calls).toHaveLength(4);
      expect(calls[0][0]).toEqual('https://auth.endpoint.test/api/v1.0/user/me');
      expect(calls[1][0]).toEqual('https://joanie.endpoint.test/api/v1.0/addresses/');
      expect(calls[2][0]).toEqual('https://joanie.endpoint.test/api/v1.0/credit-cards/');
      expect(calls[3][0]).toEqual('https://joanie.endpoint.test/api/v1.0/orders/');
    });
  });

  it('does not prefetch address, credit-cards, and order when user is anonymous', async () => {
    const deferredUser = new Deferred();

    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', deferredUser.promise);

    await act(async () => {
      render(<Wrapper />);
    });

    await act(async () => deferredUser.resolve(null));

    await waitFor(async () =>
      expect(fetchMock.lastUrl()).toEqual('https://auth.endpoint.test/api/v1.0/user/me'),
    );

    expect(fetchMock.calls()).toHaveLength(1);
    expect(fetchMock.lastUrl()).toEqual('https://auth.endpoint.test/api/v1.0/user/me');
  });

  it('clears session storage on login', async () => {
    const user = FonzieUserFactory().one();
    const userDeferred = new Deferred();

    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', userDeferred.promise);
    const { result, rerender } = renderHook(useSession, {
      wrapper: Wrapper,
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
    await waitFor(async () => expect(result.current.user).toBeUndefined());
  });

  it('clears session storage on register', async () => {
    const user = FonzieUserFactory().one();
    const userDeferred = new Deferred();

    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', userDeferred.promise);
    const { result, rerender } = renderHook(useSession, {
      wrapper: Wrapper,
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
    await waitFor(async () => expect(result.current.user).toBeUndefined());
  });
});
