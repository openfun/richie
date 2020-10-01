import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { UserMenu } from '.';

/* Enforce to use DesktopUserMenu by default */
let mockMatches = true;

const props = {
  user: {
    username: 'John Doe',
    urls: [
      {
        label: 'Log out',
        action: '/logout',
      },
      {
        label: 'Profile',
        action: 'https://acme.org/profile/johndoe',
      },
      {
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
  it('renders a dropdown with links matching the data passed to the "link" prop', async () => {
    render(
      <IntlProvider locale="en">
        <UserMenu {...props} />
      </IntlProvider>,
    );

    const button = screen.getByRole('button', {
      name: 'Access to your profile settings John Doe',
    });

    userEvent.click(button);

    screen.getByRole('link', { name: 'Profile' });
    screen.getByRole('link', { name: 'My Dashboard' });
    screen.getByRole('link', { name: 'Log out' });
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
    screen.getByRole('link', { name: 'Log out' });
  });
});
