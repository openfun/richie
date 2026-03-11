import { act, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import {
  UserFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';
import { OpenEdxApiProfileFactory } from 'utils/test/factories/openEdx';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { User } from 'types/User';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import context from 'utils/context';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  confirm: jest.fn(() => true),
}));

describe('<DashboardPreferences />', () => {
  let richieUser: User;

  beforeEach(() => {
    richieUser = UserFactory().one();
    const openEdxProfile = OpenEdxApiProfileFactory({
      username: richieUser.username,
      email: richieUser.email,
      name: richieUser.full_name,
    }).one();
    const { 'pref-lang': prefLang, ...openEdxAccount } = openEdxProfile;

    fetchMock.get('https://endpoint.test/api/v1.0/user/me', richieUser);
    fetchMock.get(
      `https://endpoint.test/api/user/v1/accounts/${richieUser.username}`,
      openEdxAccount,
    );
    fetchMock.get(`https://endpoint.test/api/user/v1/preferences/${richieUser.username}`, {
      'pref-lang': prefLang,
    });

    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('should render the OpenEdx profile section when using fonzie backend', async () => {
    const client = createTestQueryClient({ user: richieUser });
    await act(async () => {
      render(
        <BaseJoanieAppWrapper queryOptions={{ client }}>
          <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
        </BaseJoanieAppWrapper>,
      );
    });

    // The OpenEdx profile section should be visible
    await screen.findByText('Profile');
  });

  it('should not render the OpenEdx profile section when using keycloak backend', async () => {
    const originalBackend = context.authentication.backend;
    context.authentication.backend = 'keycloak';

    const client = createTestQueryClient({ user: richieUser });
    await act(async () => {
      render(
        <BaseJoanieAppWrapper queryOptions={{ client }}>
          <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
        </BaseJoanieAppWrapper>,
      );
    });

    // The OpenEdx profile section should NOT be visible
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();

    context.authentication.backend = originalBackend;
  });

  it('should not render the OpenEdx profile section when using fonzie-keycloak backend', async () => {
    const originalBackend = context.authentication.backend;
    context.authentication.backend = 'fonzie-keycloak';

    const client = createTestQueryClient({ user: richieUser });
    await act(async () => {
      render(
        <BaseJoanieAppWrapper queryOptions={{ client }}>
          <DashboardTest initialRoute={LearnerDashboardPaths.PREFERENCES} />
        </BaseJoanieAppWrapper>,
      );
    });

    // The OpenEdx profile section should NOT be visible
    expect(screen.queryByText('Profile')).not.toBeInTheDocument();

    context.authentication.backend = originalBackend;
  });
});
