import { screen } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { Link, RouteObject } from 'react-router-dom';
import { render } from 'utils/test/render';
import { RouterWrapper } from 'utils/test/wrappers/RouterWrapper';
import ProtectedRoute from '.';

describe('ProtectedRoute', () => {
  const routes: RouteObject[] = [
    {
      path: '/home',
      element: (
        <div>
          <h1>Home page</h1>
          <ul>
            <li>
              <Link to="/protected/page">To protected page</Link>
            </li>
            <li>
              <Link to="/authorized/page">To authorized page</Link>
            </li>
          </ul>
        </div>
      ),
    },
    {
      path: '/redirect',
      element: (
        <div>
          <h1>Redirect page</h1>
        </div>
      ),
    },
    {
      path: '/authorized',
      element: <ProtectedRoute isAllowed={true} redirectPath="/redirect" />,
      children: [
        {
          path: '/authorized/page',
          element: (
            <div>
              <h1>Authorized page</h1>
            </div>
          ),
        },
      ],
    },
    {
      path: '/protected',
      element: <ProtectedRoute isAllowed={false} redirectPath="/redirect" />,
      children: [
        {
          path: '/protected/page',
          element: (
            <div>
              <h1>Protected page</h1>
            </div>
          ),
        },
      ],
    },
  ];

  it('should redirect to redirectPath when route is protected', async () => {
    render(<RouterWrapper routes={routes} initialEntries={['/home']} />, {
      wrapper: null,
    });
    const user = userEvent.setup();
    await user.click(screen.getByText(/To protected page/));
    expect(await screen.findByRole('heading', { name: 'Redirect page' })).toBeInTheDocument();
  });

  it("should's redirect to redirectPath when route isn't protected", async () => {
    render(<RouterWrapper routes={routes} initialEntries={['/home']} />, {
      wrapper: null,
    });
    const user = userEvent.setup();
    await user.click(screen.getByText(/To authorized page/));
    expect(await screen.findByRole('heading', { name: 'Authorized page' })).toBeInTheDocument();
  });
});
