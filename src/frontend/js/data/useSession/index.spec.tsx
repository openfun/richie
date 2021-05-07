import React from 'react';
import { QueryClientProvider, QueryClient } from 'react-query';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import { act, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { ContextFactory, PersistedClientFactory, QueryStateFactory } from 'utils/test/factories';
import createQueryClient from 'utils/react-query/createQueryClient';
import { Deferred } from 'utils/test/deferred';
import { REACT_QUERY_SETTINGS } from 'settings';
import { SessionContext } from '.';

describe('useSession', () => {
  const context = ContextFactory().generate();
  (window as any).__richie_frontend_context__ = { context };
  const queryClient = createQueryClient({ persistor: true });
  const {
    SessionProvider,
    useSession,
  }: {
    useSession: () => SessionContext;
    SessionProvider: ({ children }: React.PropsWithChildren<any>) => JSX.Element;
  } = require('.');

  const wrapper = ({
    client = queryClient,
    children,
  }: React.PropsWithChildren<{ client: QueryClient }>) => (
    <QueryClientProvider client={client}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.useFakeTimers('modern');
    queryClient.clear();
    fetchMock.restore();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('provides a null user if whoami return 401', async () => {
    const userDeferred = new Deferred();
    fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);
    const { result } = renderHook(() => useSession(), {
      wrapper,
      initialProps: { client: queryClient },
    });

    await act(async () => {
      userDeferred.resolve(401);
      jest.runAllTimers();
    });

    expect(result.current.user).toBeNull();
    expect(result.all).toHaveLength(2);
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
      jest.runAllTimers();
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
      jest.runAllTimers();
    });

    const { user, destroy } = result.current;
    expect(user).toStrictEqual({ username });
    expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key) || '').toContain(username);

    await act(async () => {
      await destroy();
      jest.runAllTimers();
    });

    expect(result.current.user).toBeNull();
    expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key) || '').toMatch(
      /"data":null,.*"queryKey":"user"/,
    );
  });

  it('does not make request if there is a valid session in cache', async () => {
    const username = faker.internet.userName();
    const persistedClient = PersistedClientFactory({
      queries: [QueryStateFactory('user', { data: { username } })],
    });
    sessionStorage.setItem(REACT_QUERY_SETTINGS.cacheStorage.key, JSON.stringify(persistedClient));

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
});
