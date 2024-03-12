import fetchMock from 'fetch-mock';
import { act, renderHook, waitFor } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import {
  RichieContextFactory as mockRichieContextFactory,
  FonzieUserFactory,
} from 'utils/test/factories/richie';
import { Deferred } from 'utils/test/deferred';
import { REACT_QUERY_SETTINGS, RICHIE_USER_TOKEN } from 'settings';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';
import { useSession } from '.';

jest.mock('utils/errors/handle');
jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));
jest.mock('utils/indirection/window', () => ({
  location: {
    assign: jest.fn(),
  },
}));

// - Joanie Session Provider test suite
describe('JoanieSessionProvider', () => {
  setupJoanieSession();
  beforeEach(() => {
    jest.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('stores user access token within session storage', async () => {
    const user = FonzieUserFactory().one();

    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', user);

    render(
      <BaseJoanieAppWrapper
        queryOptions={{ client: createTestQueryClient({ persister: true }) }}
      />,
      { wrapper: null },
    );

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

    render(
      <BaseJoanieAppWrapper
        queryOptions={{ client: createTestQueryClient({ persister: true }) }}
      />,
      { wrapper: null },
    );
    await waitFor(async () => {
      expect(fetchMock.lastUrl()).toEqual('https://auth.endpoint.test/api/v1.0/user/me');
    });
    await waitFor(async () => expect(sessionStorage.getItem(RICHIE_USER_TOKEN)).toBeNull());
  });

  it('prefetches addresses, credit-cards and order when user is authenticated', async () => {
    const user = FonzieUserFactory().one();
    const deferredUser = new Deferred();

    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', deferredUser.promise);

    render(
      <BaseJoanieAppWrapper
        queryOptions={{ client: createTestQueryClient({ persister: true }) }}
      />,
      { wrapper: null },
    );

    await act(async () => deferredUser.resolve(user));

    await waitFor(async () => {
      const calls = fetchMock.calls();
      expect(calls).toHaveLength(4);
      expect(calls[0][0]).toEqual('https://auth.endpoint.test/api/v1.0/user/me');
      expect(calls[1][0]).toEqual('https://joanie.endpoint/api/v1.0/addresses/');
      expect(calls[2][0]).toEqual('https://joanie.endpoint/api/v1.0/credit-cards/');
      expect(calls[3][0]).toEqual('https://joanie.endpoint/api/v1.0/orders/');
    });
  });

  it('does not prefetch address, credit-cards, and order when user is anonymous', async () => {
    const deferredUser = new Deferred();

    fetchMock.get('https://auth.endpoint.test/api/v1.0/user/me', deferredUser.promise);

    render(
      <BaseJoanieAppWrapper
        queryOptions={{ client: createTestQueryClient({ persister: true }) }}
      />,
      { wrapper: null },
    );
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
      wrapper: ({ children }: PropsWithChildren) => (
        <BaseJoanieAppWrapper queryOptions={{ client: createTestQueryClient({ persister: true }) }}>
          {children}
        </BaseJoanieAppWrapper>
      ),
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
      wrapper: ({ children }: PropsWithChildren) => (
        <BaseJoanieAppWrapper queryOptions={{ client: createTestQueryClient({ persister: true }) }}>
          {children}
        </BaseJoanieAppWrapper>
      ),
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
