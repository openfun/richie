import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import BaseSessionProvider from 'contexts/SessionContext/BaseSessionProvider';
import { location } from 'utils/indirection/window';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import AuthenticatedOutlet from './AuthenticatedOutlet';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory().one(),
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

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should display child route if user is authenticated', () => {
    render(
      <AuthenticatedRouter
        client={createTestQueryClient({ user: true })}
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
    render(
      <AuthenticatedRouter
        client={createTestQueryClient()}
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
    render(
      <AuthenticatedRouter client={createTestQueryClient()} initialEntries={['/restricted']} />,
    );

    // The restricted route should not be rendered
    expect(screen.queryByTestId('route-restricted')).toBeNull();

    // location.replace should have been called with the provided redirection path
    expect(location.replace).toHaveBeenNthCalledWith(1, '/forbidden');
  });
});
