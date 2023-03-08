import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import * as mockFactories from 'utils/test/factories';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { SessionProvider } from 'data/SessionProvider';
import { DashboardLayoutRoute } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
      joanie_backend: { endpoint: 'https://joanie.endpoint' },
    })
    .generate(),
}));

const renderDashboardLayoutRoute = ({ renderLayout }: { renderLayout: boolean }) => {
  const user = mockFactories.UserFactory.generate();
  const routes = [
    {
      path: '/',
      children: [
        {
          path: '/dashboard',
          handle: {
            renderLayout: false,
          },
          element: <DashboardLayoutRoute />,
          children: [
            {
              path: '/dashboard/page',
              handle: {
                renderLayout,
              },
              element: (
                <div>
                  <h1>Awesome page title</h1>
                </div>
              ),
            },
          ],
        },
      ],
    },
  ];
  const router = createMemoryRouter(routes, { initialEntries: ['/dashboard/page'] });
  return render(
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ user })}>
        <SessionProvider>
          <RouterProvider router={router} />
        </SessionProvider>
      </QueryClientProvider>
    </IntlProvider>,
  );
};

describe('<DashboardLayoutRoute/>', () => {
  it('should display DashboardLayout', async () => {
    renderDashboardLayoutRoute({ renderLayout: false });
    expect(await screen.findByRole('heading', { name: 'Awesome page title' })).toBeInTheDocument();
    expect(screen.queryByTestId('location-display-/dashboard/page')).toBeInTheDocument();
  });

  it('should not display DashboardLayout', async () => {
    renderDashboardLayoutRoute({ renderLayout: true });
    expect(await screen.findByRole('heading', { name: 'Awesome page title' })).toBeInTheDocument();
    expect(screen.queryByTestId('location-display-/dashboard/page')).not.toBeInTheDocument();
  });
});
