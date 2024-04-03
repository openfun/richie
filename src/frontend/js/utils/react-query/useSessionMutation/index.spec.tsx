import { QueryClientProvider } from '@tanstack/react-query';
import fetchMock from 'fetch-mock';
import { PropsWithChildren } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import BaseSessionProvider from 'contexts/SessionContext/BaseSessionProvider';
import { useSession } from 'contexts/SessionContext';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { checkStatus } from 'api/utils';
import { useSessionMutation } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: {
      endpoint: 'https://endpoint.test',
      backend: 'openedx-hawthorn',
    },
  }).one(),
}));

describe('useSessionMutation', () => {
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
    fetchMock.post('http://api.endpoint/orders/create', HttpStatusCode.UNAUTHORIZED);
    fetchMock.get('https://endpoint.test/api/user/v1/me', HttpStatusCode.UNAUTHORIZED);
    const handleError = jest.fn();

    const useHooks = () => {
      const session = useSession();
      const mutation = useSessionMutation<unknown, void, unknown>({
        mutationFn: () =>
          fetch('http://api.endpoint/orders/create', { method: 'POST' }).then(checkStatus),
        onError: handleError,
      });

      return { session, mutation };
    };

    const { result } = renderHook(useHooks, {
      wrapper,
    });

    // - As client query has been hydrated with an existing user query,
    //   no request should have been executed.
    expect(fetchMock.calls().length).toEqual(0);
    expect(result.current.session.user).toStrictEqual({ username: 'John Doe' });

    // Execute mutation to create an order which fails with a 401 response.
    result.current.mutation.mutate();

    // - User queries should have invalidated so user has been refetched as the authentication
    //   endpoint returns a 401 response, user should be null.
    await waitFor(() => expect(result.current.session.user).toBeNull());
    expect(fetchMock.calls().length).toEqual(2);
    // - The first request should be the mutation to create an order
    expect(fetchMock.calls()[0][0]).toEqual('http://api.endpoint/orders/create');
    // - The second request should be the query to get the user
    expect(fetchMock.calls()[1][0]).toEqual('https://endpoint.test/api/user/v1/me');
    // - Finally the provided onError shoulb have been executed
    expect(handleError).toHaveBeenCalledTimes(1);
  });
});
