import { QueryClient, QueryClientProvider } from 'react-query';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import { act, render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import {
  ContextFactory as mockContextFactory,
  PersistedClientFactory,
  QueryStateFactory,
  UserFactory,
} from 'utils/test/factories';
import createQueryClient from 'utils/react-query/createQueryClient';
import { Deferred } from 'utils/test/deferred';
import { REACT_QUERY_SETTINGS } from 'settings';
import BaseSessionProvider from './BaseSessionProvider';
import { useSession } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    authentication: {
      endpoint: 'https://endpoint.test',
      backend: 'openedx-hawthorn',
    },
    joanie_backend: {
      endpoint: 'https://joanie.test',
    },
  }).generate(),
}));

jest.mock('utils/indirection/window', () => ({
  location: {
    assign: jest.fn(),
  },
}));

describe('SessionProvider', () => {
  const wrapper = ({
    client = createQueryClient({ persistor: true }),
    children,
  }: React.PropsWithChildren<{ client: QueryClient }>) => (
    <QueryClientProvider client={client}>
      <BaseSessionProvider>{children}</BaseSessionProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.useFakeTimers('modern');
    jest.resetModules();
    fetchMock.restore();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('uses BaseSessionProvider if joanie is disabled', async () => {
    jest.doMock('../../utils/api/joanie.ts', () => ({
      isJoanieEnabled: false,
    }));
    jest.doMock('./BaseSessionProvider', () => ({
      __esModule: true,
      default: () => 'BaseSessionProvider',
    }));
    jest.doMock('./JoanieSessionProvider', () => ({
      __esModule: true,
      default: () => 'JoanieSessionProvider',
    }));
    const { SessionProvider: Provider } = require('.');

    render(<Provider />);

    await screen.findByText('BaseSessionProvider');
  });

  it('uses JoanieSessionProvider if joanie is enabled', async () => {
    jest.doMock('../../utils/api/joanie.ts', () => ({
      isJoanieEnabled: true,
    }));
    jest.doMock('./BaseSessionProvider', () => ({
      __esModule: true,
      default: () => 'BaseSessionProvider',
    }));
    jest.doMock('./JoanieSessionProvider', () => ({
      __esModule: true,
      default: () => 'JoanieSessionProvider',
    }));
    const { SessionProvider: Provider } = require('.');

    render(<Provider />);

    await screen.findByText('JoanieSessionProvider');
  });

  // - useSession Provider test suite
  describe('useSession', () => {
    it('provides a null user if whoami return 401', async () => {
      const userDeferred = new Deferred();
      fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);

      const { result } = renderHook(() => useSession(), {
        wrapper,
      });

      await act(async () => userDeferred.resolve(401));

      expect(result.current.user).toBeNull();
      expect(result.all).toHaveLength(2);

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      const cacheString = sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key);
      expect(cacheString).not.toBeNull();

      const client = JSON.parse(cacheString!);
      expect(client.clientState.queries).toHaveLength(1);
      expect(client.clientState.queries[0].queryKey).toEqual('user');
    });

    it('provides user infos if user is authenticated then stores in cache', async () => {
      const username = faker.internet.userName();
      const userDeferred = new Deferred();
      fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);
      const { result } = renderHook(useSession, { wrapper });

      await act(async () => {
        userDeferred.resolve({ username });
      });

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      expect(result.current.user).toStrictEqual({ username });
      expect(result.all).toHaveLength(2);

      const cacheString = sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key);
      expect(cacheString).not.toBeNull();
      expect(cacheString).toContain(username);
    });

    it('destroy session then logout', async () => {
      const username = faker.internet.userName();
      const userDeferred = new Deferred();

      fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);
      fetchMock.get('https://endpoint.test/logout', 200);
      const { result } = renderHook(useSession, { wrapper });

      await act(async () => {
        userDeferred.resolve({ username });
      });

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      const { user, destroy } = result.current;
      expect(user).toStrictEqual({ username });
      expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key)).toContain(username);

      await act(async () => {
        await destroy();
        jest.runOnlyPendingTimers();
      });

      expect(result.current.user).toBeNull();
      expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key)).toMatch(
        /"data":null,.*"queryKey":"user"/,
      );
    });

    it('does not make request if there is a valid session in cache', async () => {
      const username = faker.internet.userName();
      const persistedClient = PersistedClientFactory({
        queries: [QueryStateFactory('user', { data: { username } })],
      });
      sessionStorage.setItem(
        REACT_QUERY_SETTINGS.cacheStorage.key,
        JSON.stringify(persistedClient),
      );

      fetchMock.get('https://endpoint.test/api/user/v1/me', 200);

      let client: QueryClient;
      await waitFor(() => {
        client = createQueryClient({ persistor: true });
      });

      const { result } = renderHook(useSession, {
        wrapper,
        initialProps: { client: client! },
      });

      expect(result.current.user).toStrictEqual({ username });
      expect(fetchMock.called()).toBeFalsy();
    });

    it('clears session storage on login', async () => {
      const user = UserFactory.generate();
      const userDeferred = new Deferred();

      fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);
      const { result, rerender } = renderHook(useSession, { wrapper });

      await act(async () => {
        userDeferred.resolve(user);
      });

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      expect(result.current.user).toStrictEqual(user);
      expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key)).toContain(
        user.username,
      );

      await act(async () => {
        result.current.login();
      });

      expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key)).toBeNull();

      rerender();
      expect(result.current.user).toBeUndefined();
    });

    it('clears session storage on register', async () => {
      const user = UserFactory.generate();
      const userDeferred = new Deferred();

      fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);
      const { result, rerender } = renderHook(useSession, {
        wrapper,
      });

      await act(async () => {
        userDeferred.resolve(user);
      });

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      expect(result.current.user).toStrictEqual(user);
      expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key)).toContain(
        user.username,
      );

      await act(async () => {
        result.current.register();
      });

      expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key)).toBeNull();

      rerender();
      expect(result.current.user).toBeUndefined();
    });
  });
});
