import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { handle } from 'utils/errors/handle';
import { Deferred } from 'utils/tests/Deferred';
import { location as mockLocation } from 'utils/indirection/window';
import { CommonDataPropsFactory } from 'utils/test/factories';
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
  location: { replace: jest.fn() },
}));

describe('<UserLogin />', () => {
  const props = {
    loginUrl: '/login',
    logoutUrl: '/logout',
    signupUrl: '/signup',
    oAuth2WhoamiUrl: 'https://acme.org/fakeapi/whoami',
    context: CommonDataPropsFactory(),
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
    fetchMock.get(props.oAuth2WhoamiUrl, deferred.promise);

    const { getByText, queryByText } = render(
      <IntlProvider locale="en">
        <UserLogin {...props} />
      </IntlProvider>,
    );
    expect(fetchMock.calls('/api/v1.0/users/whoami/').length).toEqual(1);
    getByText('Loading login status...');

    await act(async () => {
      deferred.resolve(401);
    });

    getByText('Log in');
    getByText('Sign up');
    expect(fetchMock.calls(props.oAuth2WhoamiUrl).length).toEqual(1);
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

  it('triggers automatically login process if user is logged off on richie but logged in on oauth2 provider', async () => {
    const deferredWhoami = new Deferred();
    const deferredOAuth2Whoami = new Deferred();

    fetchMock.get('/api/v1.0/users/whoami/', deferredWhoami.promise);
    fetchMock.get(props.oAuth2WhoamiUrl, deferredOAuth2Whoami.promise);

    render(
      <IntlProvider locale="en">
        <UserLogin {...props} />
      </IntlProvider>,
    );

    await act(async () => {
      deferredWhoami.resolve(401);
      deferredOAuth2Whoami.resolve(200);
    });

    expect(fetchMock.calls('/api/v1.0/users/whoami/').length).toEqual(1);
    expect(fetchMock.calls(props.oAuth2WhoamiUrl).length).toEqual(1);
    expect(mockLocation.replace).toHaveBeenCalledTimes(1);
  });
});
