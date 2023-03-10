import { createMemoryRouter, RouteObject, RouterProvider } from 'react-router-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { location } from 'utils/indirection/window';
import { RouterButton } from '.';

jest.mock('utils/indirection/window', () => ({
  location: {
    replace: jest.fn(),
  },
}));

describe('<RouterButton/>', () => {
  it('navigates inside the router', async () => {
    const routes: RouteObject[] = [
      {
        path: '/',
        element: (
          <div>
            Root
            <RouterButton href="/other">Go to other</RouterButton>
          </div>
        ),
      },
      {
        path: '/other',
        element: <div>Other</div>,
      },
    ];

    render(<RouterProvider router={createMemoryRouter(routes)} />);
    screen.getByText('Root');

    const button = screen.getByRole('link', { name: 'Go to other' });
    expect(button.getAttribute('href')).toEqual('/other');
    await act(async () => {
      fireEvent.click(button);
    });

    screen.getByText('Other');
  });
  it('natively navigates', async () => {
    const routes: RouteObject[] = [
      {
        path: '/',
        element: (
          <div>
            Root
            <RouterButton href="https://fun-mooc.fr">Go to other</RouterButton>
          </div>
        ),
      },
    ];

    render(<RouterProvider router={createMemoryRouter(routes)} />);
    screen.getByText('Root');

    const button = screen.getByRole('link', { name: 'Go to other' });
    expect(button.getAttribute('href')).toEqual('https://fun-mooc.fr');
    await act(async () => {
      fireEvent.click(button);
    });

    expect(location.replace).toHaveBeenCalledWith('https://fun-mooc.fr');
  });
});
