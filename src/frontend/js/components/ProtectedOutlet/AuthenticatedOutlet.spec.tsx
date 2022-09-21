import { render, screen } from '@testing-library/react';
import { hydrate, QueryClient, QueryClientProvider } from 'react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import {
  ContextFactory as mockContextFactory,
  PersistedClientFactory,
  QueryStateFactory,
  UserFactory,
} from 'utils/test/factories';
import BaseSessionProvider from 'data/SessionProvider/BaseSessionProvider';
import { location } from 'utils/indirection/window';
import createQueryClient from 'utils/react-query/createQueryClient';
import AuthenticatedOutlet from './AuthenticatedOutlet';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory().generate(),
}));

jest.mock('utils/indirection/window', () => ({
  location: {
    replace: jest.fn(),
  },
}));

describe('<AuthenticatedOutlet />', () => {
  const AuthenticatedRouter = ({
    redirectTo,
    client,
    ...routerOptions
  }: {
    redirectTo?: string;
    client: QueryClient;
    [key: PropertyKey]: any;
  }) => {
    const routes = [
      {
        path: '/',
        element: <AuthenticatedOutlet redirectTo="/forbidden" />,
        children: [
          {
            path: '/restricted',
            element: <div data-testid="route-restricted" />,
          },
        ],
      },
      {
        path: '*',
        element: <div data-testid="route-forbidden" />,
      },
    ];

    const router = createMemoryRouter(routes, { ...routerOptions });

    return (
      <QueryClientProvider client={client}>
        <BaseSessionProvider>
          <RouterProvider router={router} />
        </BaseSessionProvider>
      </QueryClientProvider>
    );
  };

  const createQueryClientWithUser = (isAuthenticated: Boolean) => {
    const user = isAuthenticated ? UserFactory.generate() : null;
    const { clientState } = PersistedClientFactory({
      queries: [QueryStateFactory('user', { data: user })],
    });
    const client = createQueryClient();
    hydrate(client, clientState);

    return client;
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should display child route if user is authenticated', () => {
    const client = createQueryClientWithUser(true);

    render(
      <AuthenticatedRouter
        client={client}
        redirectTo="/forbidden"
        initialEntries={['/restricted']}
      />,
    );

    // The restricted route should be rendered
    screen.getByTestId('route-restricted');

    // location.replace should not have been called
    expect(location.replace).not.toBeCalled();
  });

  it('should redirect to provided path if user is anonymous', () => {
    const client = createQueryClientWithUser(false);

    render(
      <AuthenticatedRouter
        client={client}
        redirectTo="/forbidden"
        initialEntries={['/restricted']}
      />,
    );

    // The restricted route should not be rendered
    expect(screen.queryByTestId('route-restricted')).toBeNull();

    // location.replace should have been called with the provided redirection path
    expect(location.replace).toHaveBeenNthCalledWith(1, '/forbidden');
  });

  it('should redirect to "/" if user is anonymous and no redirect path is provided', () => {
    const client = createQueryClientWithUser(false);

    render(<AuthenticatedRouter client={client} initialEntries={['/restricted']} />);

    // The restricted route should not be rendered
    expect(screen.queryByTestId('route-restricted')).toBeNull();

    // location.replace should have been called with the provided redirection path
    expect(location.replace).toHaveBeenNthCalledWith(1, '/forbidden');
  });
});
