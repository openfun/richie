import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { handle } from 'utils/errors/handle';
import { Deferred } from 'utils/tests/Deferred';
import { UserLogin } from '.';

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

  const setSessionStorage = () => {
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

  beforeEach(() => fetchMock.restore());

  it('gets and renders the user name and a dropdown containing a logout link', async () => {
    const deferred = new Deferred();
    fetchMock.get('/api/v1.0/users/whoami/', deferred.promise);

    const { getByText, queryByText } = render(
      <IntlProvider locale="en">
        <UserLogin {...props} />
      </IntlProvider>,
    );
    expect(fetchMock.calls('/api/v1.0/users/whoami/').length).toEqual(1);
    getByText('Loading login status...');

    await act(async () =>
      deferred.resolve({
        full_name: 'Decimus Iunius Iuvenalis',
        username: 'Juvénal',
        urls: [
          {
            label: 'Profile',
            href: 'https://acme.org',
          },
        ],
      }),
    );

    const button = screen.getByRole('button', {
      name: 'Access to your profile settings Decimus Iunius Iuvenalis',
    });

    userEvent.click(button);

    getByText('Decimus Iunius Iuvenalis');
    getByText('Log out');
    expect(queryByText('Loading login status...')).toBeNull();
  });

  it('renders signup/login buttons when the user is not logged in', async () => {
    const deferred = new Deferred();
    fetchMock.get('/api/v1.0/users/whoami/', deferred.promise);

    const { getByText, queryByText } = render(
      <IntlProvider locale="en">
        <UserLogin {...props} />
      </IntlProvider>,
    );
    expect(fetchMock.calls('/api/v1.0/users/whoami/').length).toEqual(1);
    getByText('Loading login status...');

    await act(async () => deferred.resolve(401));
    getByText('Log in');
    getByText('Sign up');
    expect(queryByText('Loading login status...')).toBeNull();
  });

  it('defaults to the logged off state when it fails to get the user', async () => {
    const deferred = new Deferred();
    fetchMock.get('/api/v1.0/users/whoami/', deferred.promise);

    const { getByText, queryByText } = render(
      <IntlProvider locale="en">
        <UserLogin {...props} />
      </IntlProvider>,
    );
    expect(fetchMock.calls('/api/v1.0/users/whoami/').length).toEqual(1);
    getByText('Loading login status...');

    await act(async () => deferred.resolve(500));
    getByText('Log in');
    getByText('Sign up');
    expect(queryByText('Loading login status...')).toBeNull();
    expect(handle).toHaveBeenCalledWith(new Error('Failed to get current user.'));
  });
});
