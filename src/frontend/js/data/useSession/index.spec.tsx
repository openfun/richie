import React from 'react';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import { act, render } from '@testing-library/react';
import { ContextFactory } from 'utils/test/factories';
import { Deferred } from 'utils/test/deferred';
import { SESSION_CACHE_KEY } from 'settings';
import { SessionContext } from '.';

describe('useSession', () => {
  const context = ContextFactory().generate();
  (window as any).__richie_frontend_context__ = { context };
  const { SessionProvider, useSession } = require('.');

  let getLatestHookValues: (prop?: string) => SessionContext;

  const TestComponent = () => {
    const hooksValues = useSession();
    getLatestHookValues = (prop) => (prop ? hooksValues[prop] : hooksValues);
    return null;
  };

  beforeEach(() => {
    sessionStorage.clear();
    fetchMock.restore();
  });

  it('provides a null user if whoami return 401', async () => {
    const userDeferred = new Deferred();
    fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>,
    );

    await act(async () => {
      userDeferred.resolve(401);
    });

    expect(getLatestHookValues('user')).toBeNull();
    expect(sessionStorage.getItem(SESSION_CACHE_KEY)).toBeDefined();
  });

  it('provides user infos if user is authenticated and store in cache', async () => {
    const username = faker.internet.userName();
    const userDeferred = new Deferred();
    fetchMock.get('https://endpoint.test/api/user/v1/me', userDeferred.promise);

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>,
    );

    await act(async () => {
      userDeferred.resolve({ username });
    });

    expect(getLatestHookValues('user')).toStrictEqual({ username });
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

    await act(async () => {
      render(
        <SessionProvider>
          <TestComponent />
        </SessionProvider>,
      );
    });

    const { user, destroy } = getLatestHookValues();
    expect(user).toStrictEqual({ username });
    expect(atob(sessionStorage.getItem(SESSION_CACHE_KEY) || '')).toContain(username);

    await act(destroy);
    expect(getLatestHookValues('user')).toBeNull();
    expect(atob(sessionStorage.getItem(SESSION_CACHE_KEY) || '')).toContain('null');
  });

  it('do not make request if there is a session in cache', () => {
    const username = faker.internet.userName();
    sessionStorage.setItem(
      SESSION_CACHE_KEY,
      btoa(JSON.stringify({ value: { username }, expiredAt: Date.now() + 60_000 })),
    );
    const request = fetchMock.get('https://endpoint.test/api/user/v1/me', 200);

    render(
      <SessionProvider>
        <TestComponent />
      </SessionProvider>,
    );

    expect(request.called()).toBeFalsy();
    expect(atob(sessionStorage.getItem(SESSION_CACHE_KEY) || '')).toContain(username);
  });
});
