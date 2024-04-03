import { QueryClientProvider } from '@tanstack/react-query';
import fetchMock from 'fetch-mock';
import { PropsWithChildren } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import BaseSessionProvider from 'contexts/SessionContext/BaseSessionProvider';
import { useSession } from 'contexts/SessionContext';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { HttpError, HttpStatusCode } from 'utils/errors/HttpError';
import { handle as mockHandle } from 'utils/errors/handle';
import { checkStatus } from 'api/utils';
import { useSessionQuery } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: {
      endpoint: 'https://endpoint.test',
      backend: 'openedx-hawthorn',
    },
  }).one(),
}));

jest.mock('utils/errors/handle', () => ({
  handle: jest.fn(),
}));

describe('useSessionQuery', () => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={createTestQueryClient({ user: { username: 'John Doe' } })}>
      <BaseSessionProvider>{children}</BaseSessionProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.resetModules();
    fetchMock.restore();
  });

  it('should invalidate user queries if it fails with a 401 response status', async () => {
    fetchMock.get('http://api.endpoint/orders/', HttpStatusCode.UNAUTHORIZED);
    fetchMock.get('https://endpoint.test/api/user/v1/me', HttpStatusCode.UNAUTHORIZED);

    const useHooks = () => {
      const session = useSession();
      useSessionQuery(['orders'], () => fetch('http://api.endpoint/orders/').then(checkStatus));

      return session;
    };

    const { result } = renderHook(() => useHooks(), {
      wrapper,
    });

    // - At the first render, query state should be retrieved from the sessionStorage
    expect(fetchMock.calls().length).toEqual(1);
    expect(fetchMock.lastCall()![0]).toEqual('http://api.endpoint/orders/');
    expect(result.current.user).toStrictEqual({ username: 'John Doe' });

    // - As the order query failed with a 401 error,
    //   we can await that user query has been invalidated
    await waitFor(() => expect(result.current.user).toBeNull());
    await waitFor(() => expect(fetchMock.calls().length).toEqual(2));

    // - The first request should be the mutation to create an order

    // - The second request should be the query to get the user
    expect(fetchMock.calls()[1][0]).toEqual('https://endpoint.test/api/user/v1/me');
  });

  it('should handle error if the request fails due to a server error', async () => {
    fetchMock.get('http://api.endpoint/orders/', HttpStatusCode.INTERNAL_SERVER_ERROR);

    const useHooks = () => {
      const session = useSession();
      useSessionQuery(['orders'], () => fetch('http://api.endpoint/orders/').then(checkStatus));

      return session;
    };

    const { result } = renderHook(() => useHooks(), {
      wrapper,
    });

    // - At the first render, query state should be retrieved from the sessionStorage
    expect(fetchMock.calls().length).toEqual(1);
    expect(result.current.user).toStrictEqual({ username: 'John Doe' });

    // Then user orders should have been fetched
    expect(fetchMock.lastCall()![0]).toEqual('http://api.endpoint/orders/');

    // - As the order query failed with a 500 error, the error should have been handled
    await waitFor(() => {
      expect(mockHandle).toHaveBeenNthCalledWith(1, new HttpError(500, 'Internal Server Error'));
    });
  });
});
