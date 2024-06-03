import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { Deferred } from 'utils/test/deferred';
import context from 'utils/context';
import { JoanieUserApiAbilityActions, User } from 'types/User';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { JoanieUserProfileFactory } from 'utils/test/factories/joanie';
import { render } from 'utils/test/render';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
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
    joanie_backend: {
      endpoint: 'https://endpoint.test',
    },
  }).one(),
}));

describe('<UserLogin />', () => {
  beforeEach(() => {
    fetchMock
      .get('https://endpoint.test/api/v1.0/orders/', [])
      .get('https://endpoint.test/api/v1.0/addresses/', [])
      .get('https://endpoint.test/api/v1.0/credit-cards/', []);
  });
  afterEach(() => {
    fetchMock.restore();
  });

  it('gets and renders the user name and a dropdown containing a logout link', async () => {
    const user: User = UserFactory().one();

    fetchMock.get('https://endpoint.test/api/v1.0/users/me/', JoanieUserProfileFactory().one());
    render(<UserLogin context={context} />, {
      queryOptions: { client: createTestQueryClient({ user }) },
    });

    const button = await screen.findByLabelText(`Access to your profile settings`, {
      selector: 'button',
    });

    await userEvent.click(button);

    screen.getByText(user.full_name!);
    screen.getByText('Log out');
    expect(screen.queryByText('Loading login status...')).toBeNull();
  });

  it('renders signup/login buttons when the user is not logged in', async () => {
    const loginDeferred = new Deferred();
    fetchMock.get('https://auth.test/api/user/v1/me', loginDeferred.promise);

    fetchMock.get('https://endpoint.test/api/v1.0/users/me/', JoanieUserProfileFactory().one());
    render(<UserLogin context={context} />, {
      queryOptions: { client: createTestQueryClient({ user: null }) },
    });

    await act(async () => {
      loginDeferred.resolve(HttpStatusCode.UNAUTHORIZED);
    });

    expect(await screen.findByRole('button', { name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign up' })).toBeInTheDocument();

    expect(screen.queryByText('Loading login status...')).not.toBeInTheDocument();
  });

  it('should renders profile urls and bind user info if needed, for user without abilities', async () => {
    const user: User = UserFactory().one();
    const profileUrls = {
      settings: { label: 'Settings', action: 'https://auth.local.test/settings' },
      account: { label: 'Account', action: 'https://auth.local.test/u/(username)' },
      dashboard_teacher: { label: 'Teacher dashboard', action: 'https://dashboard.teacher.url' },
    };

    render(<UserLogin context={context} profileUrls={profileUrls} />, {
      queryOptions: {
        client: createTestQueryClient({
          user,
          joanieUserProfile: JoanieUserProfileFactory({
            abilities: {
              [JoanieUserApiAbilityActions.HAS_ORGANIZATION_ACCESS]: false,
              [JoanieUserApiAbilityActions.HAS_COURSE_ACCESS]: false,
            },
          }).one(),
        }),
      },
    });

    const button = await screen.findByLabelText(`Access to your profile settings`, {
      selector: 'button',
    });

    await userEvent.click(button);

    screen.getByText(user.full_name!);
    const settingsLink = screen.getByRole('link', { name: 'Settings' });
    const accountLink = screen.getByRole('link', { name: 'Account' });
    expect(settingsLink.getAttribute('href')).toEqual('https://auth.local.test/settings');
    expect(accountLink.getAttribute('href')).toEqual(`https://auth.local.test/u/${user.username}`);
    expect(screen.queryByRole('link', { name: 'Teacher dashboard' })).not.toBeInTheDocument();
  });

  it('should renders teacher dashboard menu item for user with organization access', async () => {
    const user: User = UserFactory().one();
    const profileUrls = {
      settings: { label: 'Settings', action: 'https://auth.local.test/settings' },
      account: { label: 'Account', action: 'https://auth.local.test/u/(username)' },
      dashboard_teacher: { label: 'Teacher dashboard', action: 'https://dashboard.teacher.url' },
    };

    render(<UserLogin context={context} profileUrls={profileUrls} />, {
      queryOptions: {
        client: createTestQueryClient({
          user,
          joanieUserProfile: JoanieUserProfileFactory({
            abilities: {
              [JoanieUserApiAbilityActions.HAS_ORGANIZATION_ACCESS]: true,
            },
          }).one(),
        }),
      },
    });

    const button = await screen.findByLabelText(`Access to your profile settings`, {
      selector: 'button',
    });

    await userEvent.click(button);

    screen.getByText(user.full_name!);
    const settingsLink = screen.getByRole('link', { name: 'Settings' });
    const accountLink = screen.getByRole('link', { name: 'Account' });
    expect(settingsLink.getAttribute('href')).toEqual('https://auth.local.test/settings');
    expect(accountLink.getAttribute('href')).toEqual(`https://auth.local.test/u/${user.username}`);

    const teacherDashboardLink = screen.getByRole('link', { name: 'Teacher dashboard' });
    expect(teacherDashboardLink).toBeInTheDocument();
    expect(teacherDashboardLink.getAttribute('href')).toEqual('https://dashboard.teacher.url');
  });
});
