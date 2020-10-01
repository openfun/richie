import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';

import { ContextFactory } from 'utils/test/factories';
import { SESSION_CACHE_KEY } from 'settings';
import faker from 'faker';
import { Deferred } from 'utils/test/deferred';
import { act } from 'react-dom/test-utils';

jest.mock('utils/errors/handle', () => ({
  handle: jest.fn(),
}));

jest.mock('utils/indirection/window', () => ({
  matchMedia: () => ({
    matches: true,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }),
}));

describe('<UserLogin />', () => {
  const contextProps = ContextFactory().generate();
  (window as any).__richie_frontend_context__ = { context: contextProps };
  const { UserLogin } = require('.');
  const { SessionProvider } = require('data/useSession');

  const initializeUser = () => {
    const username = faker.internet.userName();
    sessionStorage.setItem(
      SESSION_CACHE_KEY,
      btoa(
        JSON.stringify({
          value: { username },
          expiredAt: Date.now() + 60_0000,
        }),
      ),
    );
    return username;
  };

  afterEach(() => {
    sessionStorage.clear();
    fetchMock.restore();
  });

  it('gets and renders the user name and a dropdown containing a logout link', async () => {
    const username = initializeUser();

    const { getByText, queryByText } = render(
      <IntlProvider locale="en">
        <SessionProvider>
          <UserLogin context={contextProps} />
        </SessionProvider>
      </IntlProvider>,
    );

    const button = screen.getByRole('button', {
      name: `Access to your profile settings ${username}`,
    });

    userEvent.click(button);

    getByText(username);
    getByText('Log out');
    expect(queryByText('Loading login status...')).toBeNull();
  });

  it('renders signup/login buttons when the user is not logged in', async () => {
    const loginDeferred = new Deferred();
    fetchMock.get('https://endpoint.test/api/user/v1/me', loginDeferred.promise);

    const { getByText, queryByText } = render(
      <IntlProvider locale="en">
        <SessionProvider>
          <UserLogin context={contextProps} />
        </SessionProvider>
      </IntlProvider>,
    );

    await act(async () => {
      loginDeferred.resolve(401);
    });

    getByText('Log in');
    getByText('Sign up');
    expect(queryByText('Loading login status...')).toBeNull();
  });

  it('should renders profile urls and bind user info if needed', () => {
    const username = initializeUser();
    const profileUrls = [
      { label: 'Settings', action: 'https://auth.local.test/settings' },
      { label: 'Account', action: 'https://auth.local.test/u/(username)' },
    ];

    const { getByText, getByRole } = render(
      <IntlProvider locale="en">
        <SessionProvider>
          <UserLogin context={contextProps} profileUrls={profileUrls} />
        </SessionProvider>
      </IntlProvider>,
    );

    const button = screen.getByRole('button', {
      name: `Access to your profile settings ${username}`,
    });

    userEvent.click(button);

    getByText(username);
    const settingsLink = getByRole('link', { name: 'Settings' });
    const accountLink = getByRole('link', { name: 'Account' });
    expect(settingsLink.getAttribute('href')).toEqual('https://auth.local.test/settings');
    expect(accountLink.getAttribute('href')).toEqual(`https://auth.local.test/u/${username}`);
  });
});
