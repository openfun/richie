import React from 'react';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import { act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { ContextFactory } from 'utils/test/factories';
import { Deferred } from 'utils/test/deferred';
import { SESSION_CACHE_KEY } from 'settings';
import { SessionContext } from '.';

describe('useSession', () => {
  const context = ContextFactory().generate();
  (window as any).__richie_frontend_context__ = { context };
  const {
    SessionProvider,
    useSession,
  }: {
    useSession: () => SessionContext;
    SessionProvider: ({ children }: React.PropsWithChildren<any>) => JSX.Element;
  } = require('.');

  const wrapper = ({ children }: React.PropsWithChildren<any>) => (
    <SessionProvider>{children}</SessionProvider>
  );

  beforeEach(() => {
    sessionStorage.clear();
    fetchMock.restore();
  });

  it('provides a null user if whoami return 401', async () => {
    const userDeferred = new Deferred();
    fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);
    const { result } = renderHook(() => useSession(), { wrapper });

    await act(async () => {
      userDeferred.resolve(401);
    });

    expect(result.current.user).toBeNull();
    expect(result.all).toHaveLength(2);
    expect(sessionStorage.getItem(SESSION_CACHE_KEY)).toBeDefined();
  });

  it('provides user infos if user is authenticated then stores in cache', async () => {
    const username = faker.internet.userName();
    const userDeferred = new Deferred();
    fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);
    const { result } = renderHook(useSession, { wrapper });

    await act(async () => {
      userDeferred.resolve({ username });
    });

    expect(result.current.user).toStrictEqual({ username });
    expect(result.all).toHaveLength(2);
    expect(sessionStorage.getItem(SESSION_CACHE_KEY)).toBeDefined();
    expect(atob(sessionStorage.getItem(SESSION_CACHE_KEY) || '')).toContain(username);
  });

  it('destroy session then logout', async () => {
    const username = faker.internet.userName();
    sessionStorage.setItem(
      SESSION_CACHE_KEY,
      btoa(JSON.stringify({ value: { username }, expiredAt: Date.now() + 60_000 })),
    );
    fetchMock.get('https://endpoint.test/logout', 200);
    const { result } = renderHook(useSession, { wrapper });

    expect(result.current.user).toStrictEqual({ username });
    expect(atob(sessionStorage.getItem(SESSION_CACHE_KEY) || '')).toContain(username);

    await act(result.current.destroy);
    expect(result.current.user).toBeNull();
    expect(atob(sessionStorage.getItem(SESSION_CACHE_KEY) || '')).toContain('null');
  });

  it('do not make request if there is a session in cache', () => {
    const username = faker.internet.userName();
    sessionStorage.setItem(
      SESSION_CACHE_KEY,
      btoa(JSON.stringify({ value: { username }, expiredAt: Date.now() + 60_000 })),
    );
    fetchMock.get('https://endpoint.test/api/user/v1/me', 200);
    renderHook(useSession, { wrapper });

    expect(fetchMock.called()).toBeFalsy();
    expect(atob(sessionStorage.getItem(SESSION_CACHE_KEY) || '')).toContain(username);
  });
});
