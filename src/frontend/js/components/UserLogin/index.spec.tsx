import { act, render } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { handle } from 'utils/errors/handle';
import { Deferred } from 'utils/tests/Deferred';
import { UserLogin } from '.';

jest.mock('utils/errors/handle', () => ({
  handle: jest.fn(),
}));

describe('<UserLogin />', () => {
  const props = {
    loginUrl: '/login',
    logoutUrl: '/logout',
    signupUrl: '/signup',
  };

  beforeEach(() => fetchMock.restore());

  it('gets and renders the user name and a log out button', async () => {
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
      }),
    );
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
