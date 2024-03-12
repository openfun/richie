import { screen } from '@testing-library/react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { location } from 'utils/indirection/window';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { render } from 'utils/test/render';
import { BaseAppWrapper } from 'utils/test/wrappers/BaseAppWrapper';
import { RouterWrapper } from 'utils/test/wrappers/RouterWrapper';
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
  it('should display child route if user is authenticated', async () => {
    render(
      <RouterWrapper
        initialEntries={['/restricted']}
        routes={[
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
        ]}
      />,
      { wrapper: BaseAppWrapper },
    );

    // The restricted route should be rendered
    await screen.findByTestId('route-restricted');

    // location.replace should not have been called
    expect(location.replace).not.toBeCalled();
  });

  it('should redirect to provided path if user is anonymous', () => {
    render(
      <RouterWrapper
        initialEntries={['/restricted']}
        routes={[
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
        ]}
      />,
      { wrapper: BaseAppWrapper, queryOptions: { client: createTestQueryClient() } },
    );

    // The restricted route should not be rendered
    expect(screen.queryByTestId('route-restricted')).toBeNull();

    // location.replace should have been called with the provided redirection path
    expect(location.replace).toHaveBeenNthCalledWith(1, '/forbidden');
  });

  it('should redirect to "/" if user is anonymous and no redirect path is provided', () => {
    render(
      <RouterWrapper
        initialEntries={['/restricted']}
        routes={[
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
        ]}
      />,
      { wrapper: BaseAppWrapper, queryOptions: { client: createTestQueryClient() } },
    );

    // The restricted route should not be rendered
    expect(screen.queryByTestId('route-restricted')).toBeNull();

    // location.replace should have been called with the provided redirection path
    expect(location.replace).toHaveBeenNthCalledWith(1, '/forbidden');
  });
});
