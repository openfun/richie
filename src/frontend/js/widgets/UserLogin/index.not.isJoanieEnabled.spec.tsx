import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';
import { act } from 'react-dom/test-utils';
import { PropsWithChildren } from 'react';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { Deferred } from 'utils/test/deferred';
import context from 'utils/context';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { User } from 'types/User';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { Nullable } from 'types/utils';
import BaseSessionProvider from 'contexts/SessionContext/BaseSessionProvider';
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
  default: mockRichieContextFactory({
    authentication: {
      backend: 'fonzie',
      endpoint: 'https://auth.local.test',
    },
  }).one(),
}));

describe('<UserLogin />', () => {
  const Wrapper = ({
    children,
    user = false,
  }: PropsWithChildren & { user?: Nullable<User | boolean> }) => (
    <QueryClientProvider client={createTestQueryClient({ user })}>
      <IntlProvider locale="en">
        <BaseSessionProvider>{children}</BaseSessionProvider>
      </IntlProvider>
    </QueryClientProvider>
  );

  it('gets and renders the user name and a dropdown containing a logout link', async () => {
    const user: User = UserFactory({ full_name: undefined }).one();

    render(
      <Wrapper user={user}>
        <UserLogin context={context} />
      </Wrapper>,
    );

    const button = await screen.findByLabelText(`Access to your profile settings`, {
      selector: 'button',
    });

    await userEvent.click(button);

    screen.getByText(user.username);
    screen.getByText('Log out');
    expect(screen.queryByText('Loading login status...')).toBeNull();
  });

  it('renders signup/login buttons when the user is not logged in', async () => {
    const loginDeferred = new Deferred();
    fetchMock.get('https://auth.test/api/user/v1/me', loginDeferred.promise);

    render(
      <Wrapper user={null}>
        <UserLogin context={context} />
      </Wrapper>,
    );

    await act(async () => {
      loginDeferred.resolve(HttpStatusCode.UNAUTHORIZED);
    });

    expect(await screen.findByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();

    expect(screen.queryByText('Loading login status...')).not.toBeInTheDocument();
  });

  it('should renders profile urls and bind user info if needed', async () => {
    const user: User = UserFactory().one();
    const profileUrls = {
      settings: { label: 'Settings', action: 'https://auth.local.test/settings' },
      account: { label: 'Account', action: 'https://auth.local.test/u/(username)' },
    };

    render(
      <Wrapper user={user}>
        <UserLogin context={context} profileUrls={profileUrls} />
      </Wrapper>,
    );

    const button = await screen.findByLabelText(`Access to your profile settings`, {
      selector: 'button',
    });

    await userEvent.click(button);

    screen.getByText(user.full_name!);
    const settingsLink = screen.getByRole('link', { name: 'Settings' });
    const accountLink = screen.getByRole('link', { name: 'Account' });
    expect(settingsLink.getAttribute('href')).toEqual('https://auth.local.test/settings');
    expect(accountLink.getAttribute('href')).toEqual(`https://auth.local.test/u/${user.username}`);
  });
});
