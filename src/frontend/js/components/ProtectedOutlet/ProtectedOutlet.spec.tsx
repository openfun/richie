import { screen, render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { location } from 'utils/indirection/window';
import ProtectedOutlet from './ProtectedOutlet';

jest.mock('utils/indirection/window', () => ({
  location: {
    replace: jest.fn(),
  },
}));

describe('<ProtectedOutlet />', () => {
  const ProtectedRouter = ({
    isAllowed,
    redirectTo,
    ...routerOptions
  }: {
    isAllowed: Boolean;
    redirectTo?: string;
    [key: PropertyKey]: any;
  }) => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <ProtectedOutlet isAllowed={isAllowed} redirectTo={redirectTo} />,
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
      ],
      { ...routerOptions },
    );

    return <RouterProvider router={router} />;
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should display child route if isAllowed is true', () => {
    render(
      <ProtectedRouter isAllowed={true} redirectTo="/forbidden" initialEntries={['/restricted']} />,
    );

    // The restricted route should be rendered
    screen.getByTestId('route-restricted');

    // location.replace should not have been called
    expect(location.replace).not.toBeCalled();
  });

  it('should redirect to provided path if isAllowed is false', () => {
    render(<ProtectedRouter isAllowed={false} redirectTo="/forbidden" initialEntries={['/']} />);

    // The restricted route should not be rendered
    expect(screen.queryByTestId('route-restricted')).toBeNull();

    // location.replace should have been called with the provided redirection path
    expect(location.replace).toHaveBeenNthCalledWith(1, '/forbidden');
  });

  it('should redirect to "/" if isAllowed is false and no redirect path is provided', () => {
    render(<ProtectedRouter isAllowed={false} initialEntries={['/']} />);

    // The restricted route should not be rendered
    expect(screen.queryByTestId('route-restricted')).toBeNull();

    // location.replace should have been called with the provided redirection path
    expect(location.replace).toHaveBeenNthCalledWith(1, '/');
  });
});
