import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { UserMenu } from '.';

/* Enforce to use DesktopUserMenu by default */
let mockMatches = true;

const logout = jest.fn();

const props = {
  user: {
    username: 'John Doe',
    urls: [
      {
        key: 'logout',
        label: 'Log out',
        action: logout,
      },
      {
        key: 'profile',
        label: 'Profile',
        action: 'https://acme.org/profile/johndoe',
      },
      {
        key: 'dashboard',
        label: 'My Dashboard',
        action: 'https://acme.org/dashboard',
      },
    ],
  },
};

jest.mock('utils/indirection/window', () => ({
  matchMedia: () => ({
    matches: mockMatches,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }),
}));

describe('<UserMenu />', () => {
  afterEach(() => jest.resetAllMocks());

  it('renders a dropdown with links matching the data passed to the "link" prop', async () => {
    render(
      <IntlProvider locale="en">
        <UserMenu {...props} />
      </IntlProvider>,
    );

    const button = screen.getByLabelText('Access to your profile settings', {
      selector: 'button',
    });

    await userEvent.click(button);

    screen.getByRole('link', { name: 'Profile' });
    screen.getByRole('link', { name: 'My Dashboard' });
    const logoutButton = screen.getByRole('button', { name: 'Log out' });

    await userEvent.click(logoutButton);

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it('renders a list of links matching the data passed to the "link" prop on Mobile/Tablet', async () => {
    /* Enforce to use MobileUserMenu */
    mockMatches = false;

    render(
      <IntlProvider locale="en">
        <UserMenu {...props} />
      </IntlProvider>,
    );

    screen.getByRole('heading', { name: 'John Doe' });
    screen.getByRole('link', { name: 'Profile' });
    screen.getByRole('link', { name: 'My Dashboard' });
    const logoutButton = screen.getByRole('button', { name: 'Log out' });

    await userEvent.click(logoutButton);

    expect(logout).toHaveBeenCalledTimes(1);
  });
});
