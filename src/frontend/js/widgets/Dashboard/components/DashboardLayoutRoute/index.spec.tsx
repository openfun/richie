import { screen } from '@testing-library/react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { render } from 'utils/test/render';
import { RouterWrapper } from 'utils/test/wrappers/RouterWrapper';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { DashboardLayoutRoute } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

const getRoutes = ({ renderLayout }: { renderLayout: boolean }) => [
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

describe('<DashboardLayoutRoute/>', () => {
  setupJoanieSession();

  it('should display DashboardLayout', async () => {
    render(
      <RouterWrapper
        initialEntries={['/dashboard/page']}
        routes={getRoutes({ renderLayout: false })}
      />,
      {
        wrapper: BaseJoanieAppWrapper,
      },
    );

    expect(await screen.findByRole('heading', { name: 'Awesome page title' })).toBeInTheDocument();
    expect(screen.queryByTestId('location-display-/dashboard/page')).toBeInTheDocument();
  });

  it('should not display DashboardLayout', async () => {
    render(
      <RouterWrapper
        initialEntries={['/dashboard/page']}
        routes={getRoutes({ renderLayout: true })}
      />,
      {
        wrapper: BaseJoanieAppWrapper,
      },
    );
    expect(await screen.findByRole('heading', { name: 'Awesome page title' })).toBeInTheDocument();
    expect(screen.queryByTestId('location-display-/dashboard/page')).not.toBeInTheDocument();
  });
});
