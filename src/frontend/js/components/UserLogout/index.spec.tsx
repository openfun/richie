import React from 'react';
import { act, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { SessionProvider } from 'data/useSession';

import { Deferred } from 'utils/tests/Deferred';
import { location } from 'utils/indirection/window';
import { UserLogout } from '.';

jest.useFakeTimers();
jest.mock('utils/indirection/window', () => ({
  location: { replace: jest.fn(), search: '' },
}));
jest.mock('utils/isSafeURI', () => ({
  isSafeURI: jest.fn(() => true),
}));

beforeEach(() => {
  fetchMock.restore();
  jest.clearAllMocks();
  jest.clearAllTimers();
});

describe('UserLogout', () => {
  const props = {
    logoutUrls: ['http://example.org/logout', 'http://acme.test/logout'],
    logoutRedirectUrl: 'http://afterthelogout.local',
  };

  it('renders a view to explain the in progress process and redirect to logoutRedirectUrl props', async () => {
    const deferred = new Deferred();
    props.logoutUrls.map((url) => fetchMock.get(url, deferred.promise));

    const { getByText } = render(
      <IntlProvider locale="en">
        <SessionProvider>
          <UserLogout {...props} />
        </SessionProvider>
      </IntlProvider>,
    );

    getByText('Logging out from Richie applications, please wait...');
    screen.getByRole('link', {
      name: 'back to home manually',
    });

    await act(async () => {
      deferred.resolve(200);
    });
    act(() => {
      jest.runAllTimers();
    });

    expect(location.replace).toHaveBeenCalledTimes(1);
    expect(location.replace).toBeCalledWith(props.logoutRedirectUrl);
  });

  it('use next param to redirect after logout if it is a safe uri', async () => {
    const deferred = new Deferred();
    location.search = '?next=http://localhost:8070/safe-home';
    props.logoutUrls.map((url) => fetchMock.get(url, deferred.promise));

    render(
      <IntlProvider locale="en">
        <SessionProvider>
          <UserLogout {...props} />
        </SessionProvider>
      </IntlProvider>,
    );

    await act(async () => {
      deferred.resolve(200);
    });
    act(() => {
      jest.runAllTimers();
    });

    expect(location.replace).toHaveBeenCalledTimes(1);
    expect(location.replace).toBeCalledWith('http://localhost:8070/safe-home');
  });
});
