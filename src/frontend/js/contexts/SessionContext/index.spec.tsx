import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { faker } from '@faker-js/faker';
import fetchMock from 'fetch-mock';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { Deferred } from 'utils/test/deferred';
import { REACT_QUERY_SETTINGS } from 'settings';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { User } from 'types/User';
import { HttpStatusCode } from 'utils/errors/HttpError';
import BaseSessionProvider from './BaseSessionProvider';
import { useSession } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: {
      endpoint: 'https://endpoint.test',
      backend: 'openedx-hawthorn',
    },
    joanie_backend: {
      endpoint: 'https://joanie.test',
    },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  location: {
    assign: jest.fn(),
  },
}));

describe('SessionProvider', () => {
  const wrapper =
    (client?: QueryClient) =>
    ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client ?? createTestQueryClient({ persister: true })}>
        <BaseSessionProvider>{children}</BaseSessionProvider>
      </QueryClientProvider>
    );

  beforeEach(() => {
    jest.useFakeTimers();
    jest.resetModules();
    fetchMock.restore();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('uses BaseSessionProvider if joanie is disabled', async () => {
    jest.doMock('api/joanie.ts', () => ({
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
    jest.doMock('api/joanie.ts', () => ({
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
        wrapper: wrapper(),
      });

      await act(async () => {
        userDeferred.resolve(HttpStatusCode.UNAUTHORIZED);
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
      });

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      const cacheString = sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key);
      expect(cacheString).not.toBeNull();

      const client = JSON.parse(cacheString!);
      expect(client.clientState.queries).toHaveLength(1);
      expect(client.clientState.queries[0].queryKey).toEqual(['user']);
    });

    it('provides user infos if user is authenticated then stores in cache', async () => {
      const username = faker.internet.userName();
      const userDeferred = new Deferred();
      fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);
      const { result } = renderHook(useSession, { wrapper: wrapper() });

      await act(async () => {
        userDeferred.resolve({ username });
      });

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      expect(result.current.user).toStrictEqual({ username });

      const cacheString = sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key);
      expect(cacheString).not.toBeNull();
      expect(cacheString).toContain(username);
    });

    it('destroy session then logout', async () => {
      const username = faker.internet.userName();
      const userDeferred = new Deferred();

      fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);
      fetchMock.get('https://endpoint.test/logout', HttpStatusCode.OK);
      const { result } = renderHook(useSession, { wrapper: wrapper() });

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
        destroy();
        jest.runOnlyPendingTimers();
      });

      await waitFor(() => expect(result.current.user).toBeNull());
      expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key)).toBeNull();
    });

    it('does not make request if there is a valid session in cache', async () => {
      const user: User = UserFactory().one();
      fetchMock.get('https://endpoint.test/api/user/v1/me', HttpStatusCode.OK);

      const { result } = renderHook(useSession, {
        wrapper: wrapper(createTestQueryClient({ user })),
      });

      expect(result.current.user).toStrictEqual(user);
      expect(fetchMock.called()).toBeFalsy();
    });

    it('clears session storage on login', async () => {
      const user = UserFactory().one();
      const userDeferred = new Deferred();

      fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);
      const { result, rerender } = renderHook(useSession, { wrapper: wrapper() });

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

      await act(async () => {
        rerender();
      });

      await waitFor(async () => expect(result.current.user).toBeUndefined());
    });

    it('clears session storage on register', async () => {
      const user = UserFactory().one();
      const userDeferred = new Deferred();

      fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);
      const { result, rerender } = renderHook(useSession, {
        wrapper: wrapper(),
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

      await waitFor(async () => expect(result.current.user).toBeUndefined());
    });
  });
});
