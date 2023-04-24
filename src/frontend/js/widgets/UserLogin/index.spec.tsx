import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { act } from 'react-dom/test-utils';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { Deferred } from 'utils/test/deferred';
import context from 'utils/context';
import { SessionProvider } from 'contexts/SessionContext';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { User } from 'types/User';
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
  default: mockRichieContextFactory().one(),
}));

describe('<UserLogin />', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it('gets and renders the user name and a dropdown containing a logout link', async () => {
    const user: User = UserFactory().one();

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <UserLogin context={context} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    const button = screen.getByLabelText(`Access to your profile settings`, {
      selector: 'button',
    });

    await userEvent.click(button);

    screen.getByText(user.username);
    screen.getByText('Log out');
    expect(screen.queryByText('Loading login status...')).toBeNull();
  });

  it('renders signup/login buttons when the user is not logged in', async () => {
    const loginDeferred = new Deferred();
    fetchMock.get('https://endpoint.test/api/user/v1/me', loginDeferred.promise);

    const { queryByText, findByText } = render(
      <QueryClientProvider client={createTestQueryClient()}>
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

    await findByText('Log in');
    await findByText('Sign up');
    expect(queryByText('Loading login status...')).toBeNull();
  });

  it('should renders profile urls and bind user info if needed', async () => {
    const user: User = UserFactory().one();
    const profileUrls = {
      settings: { label: 'Settings', action: 'https://auth.local.test/settings' },
      account: { label: 'Account', action: 'https://auth.local.test/u/(username)' },
    };

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <UserLogin context={context} profileUrls={profileUrls} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    const button = screen.getByLabelText(`Access to your profile settings`, {
      selector: 'button',
    });

    await userEvent.click(button);

    screen.getByText(user.username);
    const settingsLink = screen.getByRole('link', { name: 'Settings' });
    const accountLink = screen.getByRole('link', { name: 'Account' });
    expect(settingsLink.getAttribute('href')).toEqual('https://auth.local.test/settings');
    expect(accountLink.getAttribute('href')).toEqual(`https://auth.local.test/u/${user.username}`);
  });
});
