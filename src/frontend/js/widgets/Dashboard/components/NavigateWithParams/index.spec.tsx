import { screen } from '@testing-library/react';
import { Outlet } from 'react-router-dom';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import LocationDisplay from 'utils/test/LocationDisplay';
import { render } from 'utils/test/render';
import { RouterWrapper } from 'utils/test/wrappers/RouterWrapper';
import NavigateWithParams from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory().one(),
}));

jest.mock('utils/indirection/window', () => ({
  location: {
    replace: jest.fn(),
  },
}));

describe('<NavigateWithParams />', () => {
  it('should navigate with parent route params', async () => {
    const routes = [
      {
        path: '/:testId',
        element: (
          <div>
            <h1>NavigateWithParams test</h1>
            <Outlet />
          </div>
        ),
        children: [
          {
            index: true,
            element: <NavigateWithParams to="/:testId/childRoute" replace />,
          },
          {
            path: '/:testId/childRoute',
            element: (
              <div>
                <h2>NavigateWithParams child route</h2>
                <LocationDisplay />
              </div>
            ),
          },
        ],
      },
    ];
    render(<RouterWrapper routes={routes} initialEntries={['/myTestId']} />, { wrapper: null });
    expect(await screen.findByRole('heading', { name: /NavigateWithParams test/ }));
    expect(screen.getByRole('heading', { name: /NavigateWithParams child route/ }));
    expect(screen.getByTestId('test-location-display')).toHaveTextContent('/myTestId/childRoute');
  });
});
