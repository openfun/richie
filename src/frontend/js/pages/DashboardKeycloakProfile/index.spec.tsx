import { screen } from '@testing-library/dom';
import {
  UserFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import { render } from 'utils/test/render';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { User } from 'types/User';
import { AuthenticationApi } from 'api/authentication';
import { APIAuthentication } from 'types/api';
import DashboardKeycloakProfile, { DEFAULT_DISPLAYED_FORM_VALUE } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: {
      endpoint: 'https://endpoint.test',
      backend: 'fonzie',
    },
    joanie_backend: {
      endpoint: 'https://joanie.endpoint',
    },
  }).one(),
}));

describe('pages.DashboardKeycloakProfile', () => {
  let richieUser: User;
  let originalAccount: APIAuthentication['account'];
  const mockAccountUpdateUrl = 'https://keycloak.test/auth/realms/richie/account';
  setupJoanieSession();

  beforeEach(() => {
    richieUser = UserFactory().one();
    originalAccount = AuthenticationApi!.account;
    AuthenticationApi!.account = {
      get: () => ({
        username: richieUser.username,
        email: richieUser.email,
        firstName: null,
        lastName: null,
      }),
      updateUrl: () => mockAccountUpdateUrl,
    };
  });

  afterEach(() => {
    AuthenticationApi!.account = originalAccount;
  });

  it('should render profile information', async () => {
    render(<DashboardKeycloakProfile />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Account information')).toBeInTheDocument();

    expect(await screen.findByDisplayValue(richieUser.username)).toBeInTheDocument();
    expect(screen.getByDisplayValue(richieUser.email!)).toBeInTheDocument();

    const editLink = screen.getByRole('link', { name: 'Edit your profile' });
    expect(editLink).toBeInTheDocument();
    expect(editLink).toHaveAttribute('href', mockAccountUpdateUrl);
  });

  it('should render default values when user fields are empty', async () => {
    const userWithoutEmail = UserFactory({ email: undefined }).one();

    render(<DashboardKeycloakProfile />, {
      queryOptions: { client: createTestQueryClient({ user: userWithoutEmail }) },
    });

    expect(await screen.findByDisplayValue(userWithoutEmail.username)).toBeInTheDocument();
    expect(screen.getByLabelText('Account email')).toHaveValue(DEFAULT_DISPLAYED_FORM_VALUE);
  });
});
