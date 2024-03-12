import { screen } from '@testing-library/react';
import { location } from 'utils/indirection/window';
import { render } from 'utils/test/render';
import { RouterWrapper } from 'utils/test/wrappers/RouterWrapper';
import ProtectedOutlet from './ProtectedOutlet';

jest.mock('utils/indirection/window', () => ({
  location: {
    replace: jest.fn(),
  },
}));

describe('<ProtectedOutlet />', () => {
  it('should display child route if isAllowed is true', () => {
    render(
      <RouterWrapper
        initialEntries={['/restricted']}
        routes={[
          {
            path: '/',
            element: <ProtectedOutlet isAllowed={true} redirectTo="/forbidden" />,
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
      { wrapper: null },
    );

    // The restricted route should be rendered
    screen.getByTestId('route-restricted');

    // location.replace should not have been called
    expect(location.replace).not.toBeCalled();
  });

  it('should redirect to provided path if isAllowed is false', () => {
    render(
      <RouterWrapper
        initialEntries={['/']}
        routes={[
          {
            path: '/',
            element: <ProtectedOutlet isAllowed={false} redirectTo="/forbidden" />,
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
      { wrapper: null },
    );
    // The restricted route should not be rendered
    expect(screen.queryByTestId('route-restricted')).toBeNull();

    // location.replace should have been called with the provided redirection path
    expect(location.replace).toHaveBeenNthCalledWith(1, '/forbidden');
  });

  it('should redirect to "/" if isAllowed is false and no redirect path is provided', () => {
    render(
      <RouterWrapper
        initialEntries={['/']}
        routes={[
          {
            path: '/',
            element: <ProtectedOutlet isAllowed={false} />,
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
      { wrapper: null },
    );

    // The restricted route should not be rendered
    expect(screen.queryByTestId('route-restricted')).toBeNull();

    // location.replace should have been called with the provided redirection path
    expect(location.replace).toHaveBeenNthCalledWith(1, '/');
  });
});
