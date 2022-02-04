import { hydrate, QueryClient, QueryClientProvider } from 'react-query';
import fetchMock from 'fetch-mock';
import { renderHook } from '@testing-library/react-hooks';
import {
  ContextFactory as mockContextFactory,
  PersistedClientFactory,
  QueryStateFactory,
} from 'utils/test/factories';
import BaseSessionProvider from 'data/SessionProvider/BaseSessionProvider';
import createQueryClient from 'utils/react-query/createQueryClient';
import { useSession } from 'data/SessionProvider';
import { checkStatus } from 'utils/api/joanie';
import { PropsWithChildren } from 'react';
import { waitFor } from '@testing-library/react';
import { useSessionMutation } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    authentication: {
      endpoint: 'https://endpoint.test',
      backend: 'openedx-hawthorn',
    },
  }).generate(),
}));

describe('useSessionMutation', () => {
  const wrapper = ({ client, children }: PropsWithChildren<{ client: QueryClient }>) => (
    <QueryClientProvider client={client}>
      <BaseSessionProvider>{children}</BaseSessionProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.resetModules();
    fetchMock.restore();
  });

  it('should invalidate user queries if it fails with a 401 response status', async () => {
    fetchMock.post('http://api.endpoint/orders/create', 401);
    fetchMock.get('https://endpoint.test/api/user/v1/me', 401);
    const handleError = jest.fn();

    const useHooks = () => {
      const session = useSession();
      const mutation = useSessionMutation<unknown, void, unknown>(
        () => fetch('http://api.endpoint/orders/create', { method: 'POST' }).then(checkStatus),
        {
          onError: handleError,
        },
      );

      return { session, mutation };
    };

    const { clientState } = PersistedClientFactory({
      queries: [QueryStateFactory('user', { data: { username: 'John Doe' } })],
    });

    let client: QueryClient;
    await waitFor(() => {
      client = createQueryClient();
      hydrate(client, clientState);
    });

    const { result } = renderHook(useHooks, {
      wrapper,
      initialProps: { client: client! },
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
