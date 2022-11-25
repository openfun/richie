import { act, fireEvent, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouteObject, RouterProvider } from 'react-router-dom';
import { RouterButton } from '../RouterButton';
import { App } from './App';

describe('App', () => {
  it('should render Example Route', async () => {
    let mockNavigate: any;
    jest.doMock('react-router-dom', () => {
      return {
        __esModule: true,
        useNavigate: () => {
          const navigate = jest.requireActual('react-router-dom').useNavigate();
          mockNavigate = jest.fn(navigate);
          return mockNavigate;
        },
      };
    });

    // const spyNavigate = jest.spyOn(RRD, 'useNavigate').mockImplementation(jest.fn());

    // const { RouterButton } = require('../RouterButton');

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

    const button = screen.getByRole('link', { name: 'Go to other' });
    expect(button.getAttribute('href')).toEqual('/other');
    await act(async () => {
      fireEvent.click(button);
    });

    screen.debug();
    // expect(spyNavigate).toHaveBeenNthCalledWith(1, '/other');
  });
});
