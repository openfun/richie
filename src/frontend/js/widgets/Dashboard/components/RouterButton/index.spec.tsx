import { RouteObject } from 'react-router';
import { act, fireEvent, screen } from '@testing-library/react';
import { location } from 'utils/indirection/window';
import { render } from 'utils/test/render';
import { RouterWrapper } from 'utils/test/wrappers/RouterWrapper';
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

    render(<RouterWrapper routes={routes} />, { wrapper: null });
    screen.getByText('Root');

    const button = screen.getByRole('link', { name: 'Go to other' });
    expect(button.getAttribute('href')).toEqual('/other');
    await act(async () => {
      fireEvent.click(button);
    });

    screen.getByText('Other');
  });
  it('natively navigates', async () => {
    render(
      <div>
        Root
        <RouterButton href="https://fun-mooc.fr">Go to other</RouterButton>
      </div>,
      {
        wrapper: RouterWrapper,
      },
    );
    screen.getByText('Root');

    const button = screen.getByRole('link', { name: 'Go to other' });
    expect(button.getAttribute('href')).toEqual('https://fun-mooc.fr');
    await act(async () => {
      fireEvent.click(button);
    });

    expect(location.replace).toHaveBeenCalledWith('https://fun-mooc.fr');
  });
});
