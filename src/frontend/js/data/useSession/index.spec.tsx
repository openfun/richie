import React from 'react';
import { QueryClientProvider } from 'react-query';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import { act, render } from '@testing-library/react';
import { ContextFactory, PersistedClientFactory, QueryStateFactory } from 'utils/test/factories';
import createQueryClient from 'utils/api/queryClient';
import { Deferred } from 'utils/test/deferred';
import { REACT_QUERY_SETTINGS } from 'settings';

describe('useSession', () => {
  const context = ContextFactory().generate();
  (window as any).__richie_frontend_context__ = { context };
  const { SessionProvider, useSession } = require('.');
  const queryClient = createQueryClient({ persistor: true });
  let getLatestHookValues: (prop?: string) => any;

  const TestComponent = () => {
    const hooksValues = useSession();
    getLatestHookValues = (prop) => (prop ? hooksValues[prop] : hooksValues);
    return null;
  };

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

    render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <TestComponent />
        </SessionProvider>
      </QueryClientProvider>,
    );

    await act(async () => {
      userDeferred.resolve(401);
      jest.runAllTimers();
    });

    expect(getLatestHookValues('user')).toBeNull();
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

    render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <TestComponent />
        </SessionProvider>
      </QueryClientProvider>,
    );

    await act(async () => {
      userDeferred.resolve({ username });
      jest.runAllTimers();
    });

    expect(getLatestHookValues('user')).toStrictEqual({ username });
    const cacheString = sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key);
    expect(cacheString).not.toBeNull();
    expect(cacheString).toContain(username);
  });

  it('destroy session then logout', async () => {
    const username = faker.internet.userName();
    const userDeferred = new Deferred();

    fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);
    fetchMock.get('https://endpoint.test/logout', 200);

    render(
      <QueryClientProvider client={queryClient}>
        <SessionProvider>
          <TestComponent />
        </SessionProvider>
      </QueryClientProvider>,
    );

    await act(async () => {
      userDeferred.resolve({ username });
      jest.runAllTimers();
    });

    const { user, destroy } = getLatestHookValues();
    expect(user).toStrictEqual({ username });
    expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key) || '').toContain(username);

    await act(async () => {
      await destroy();
      jest.runAllTimers();
    });

    expect(getLatestHookValues('user')).toBeNull();
    expect(sessionStorage.getItem(REACT_QUERY_SETTINGS.cacheStorage.key) || '').toMatch(
      /"data":null,.*"queryKey":"user"/,
    );
  });

  it('do not make request if there is a valid session in cache', async () => {
    const username = faker.internet.userName();

    const persistedClient = PersistedClientFactory({
      queries: [QueryStateFactory('user', { data: { username } })],
    });

    sessionStorage.setItem(REACT_QUERY_SETTINGS.cacheStorage.key, JSON.stringify(persistedClient));

    fetchMock.get('https://endpoint.test/api/user/v1/me', 200);

    await act(() => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <SessionProvider>
            <TestComponent />
          </SessionProvider>
        </QueryClientProvider>,
      );
    });

    expect(getLatestHookValues('user')).toStrictEqual({ username });
    expect(fetchMock.called()).toBeFalsy();
  });
});
