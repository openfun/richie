import faker from 'faker';
import { QueryClientProvider } from 'react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { act } from 'react-dom/test-utils';
import {
  ContextFactory as mockContextFactory,
  PersistedClientFactory,
  QueryStateFactory,
} from 'utils/test/factories';
import { Deferred } from 'utils/test/deferred';
import createQueryClient from 'utils/react-query/createQueryClient';
import context from 'utils/context';
import { REACT_QUERY_SETTINGS } from 'settings';
import { SessionProvider } from 'data/SessionProvider';
import UserLogin from '.';

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

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory().generate(),
}));

describe('<UserLogin />', () => {
  const initializeUser = () => {
    const username = faker.internet.userName();
    sessionStorage.setItem(
      REACT_QUERY_SETTINGS.cacheStorage.key,
      JSON.stringify(
        PersistedClientFactory({
          queries: [QueryStateFactory('user', { data: { username } })],
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

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <UserLogin context={context} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    const button = screen.getByLabelText(`Access to your profile settings ${username}`, {
      selector: 'button',
    });

    userEvent.click(button);

    screen.getByText(username);
    screen.getByText('Log out');
    expect(screen.queryByText('Loading login status...')).toBeNull();
  });

  it('renders signup/login buttons when the user is not logged in', async () => {
    const loginDeferred = new Deferred();
    fetchMock.get('https://endpoint.test/api/user/v1/me', loginDeferred.promise);

    const { getByText, queryByText } = render(
      <QueryClientProvider client={createQueryClient({ persistor: true })}>
        <IntlProvider locale="en">
          <SessionProvider>
            <UserLogin context={context} />
          </SessionProvider>
        </IntlProvider>
      </QueryClientProvider>,
    );

    await act(async () => {
      loginDeferred.resolve(401);
    });

    getByText('Log in');
    getByText('Sign up');
    expect(queryByText('Loading login status...')).toBeNull();
  });

  it('should renders profile urls and bind user info if needed', async () => {
    const username = initializeUser();
    const profileUrls = {
      settings: { label: 'Settings', action: 'https://auth.local.test/settings' },
      account: { label: 'Account', action: 'https://auth.local.test/u/(username)' },
    };

    await act(async () => {
      render(
        <QueryClientProvider client={createQueryClient({ persistor: true })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <UserLogin context={context} profileUrls={profileUrls} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    const button = screen.getByLabelText(`Access to your profile settings ${username}`, {
      selector: 'button',
    });

    userEvent.click(button);

    screen.getByText(username);
    const settingsLink = screen.getByRole('link', { name: 'Settings' });
    const accountLink = screen.getByRole('link', { name: 'Account' });
    expect(settingsLink.getAttribute('href')).toEqual('https://auth.local.test/settings');
    expect(accountLink.getAttribute('href')).toEqual(`https://auth.local.test/u/${username}`);
  });
});
