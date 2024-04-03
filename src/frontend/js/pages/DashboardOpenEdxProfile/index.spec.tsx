import { screen } from '@testing-library/dom';
import fetchMock from 'fetch-mock';
import countries from 'i18n-iso-countries';
import { createIntl } from 'react-intl';
import {
  UserFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import { render } from 'utils/test/render';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { OpenEdxApiProfileFactory } from 'utils/test/factories/openEdx';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { genderMessages, levelOfEducationMessages } from 'hooks/useOpenEdxProfile/utils';
import { HttpStatusCode } from 'utils/errors/HttpError';
import DashboardOpenEdxProfile from '.';

jest.mock('utils/errors/handle');
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

describe('pages.DashboardOpenEdxProfile', () => {
  setupJoanieSession();

  it('should render profile informations', async () => {
    const intl = createIntl({ locale: 'en' });
    const languageNames = new Intl.DisplayNames([intl.locale], { type: 'language' });
    const richieUser = UserFactory().one();
    const openEdxProfile = OpenEdxApiProfileFactory({
      username: richieUser.username,
      email: richieUser.email,
      name: richieUser.full_name,
    }).one();

    const { 'pref-lang': prefLang, ...openEdxAccount } = openEdxProfile;

    fetchMock.get(
      `https://endpoint.test/api/user/v1/accounts/${richieUser.username}`,
      openEdxAccount,
    );
    fetchMock.get(`https://endpoint.test/api/user/v1/preferences/${richieUser.username}`, {
      'pref-lang': prefLang,
    });

    render(<DashboardOpenEdxProfile />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    expect(screen.getByText('Profile')).toBeInTheDocument();

    expect(screen.getByText('Basic account information')).toBeInTheDocument();
    expect(
      await screen.findByDisplayValue(countries.getName(openEdxAccount.country!, 'en')!),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(openEdxAccount.email)).toBeInTheDocument();
    expect(screen.getByDisplayValue(languageNames.of(prefLang!)!)).toBeInTheDocument();
    expect(screen.getByDisplayValue(openEdxAccount.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(openEdxAccount.username)).toBeInTheDocument();

    expect(screen.getByText('Additional account information')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        intl.formatMessage(levelOfEducationMessages[openEdxAccount.level_of_education!]),
      ),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue(openEdxAccount.year_of_birth!)).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(intl.formatMessage(genderMessages[openEdxAccount.gender!])),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(languageNames.of(openEdxAccount.language_proficiencies[0].code)!),
    ).toBeInTheDocument();
  });

  it('should display get error when account request fail', async () => {
    const richieUser = UserFactory().one();

    fetchMock.get(
      `https://endpoint.test/api/user/v1/accounts/${richieUser.username}`,
      new Response('', { status: HttpStatusCode.NOT_FOUND }),
    );
    fetchMock.get(`https://endpoint.test/api/user/v1/preferences/${richieUser.username}`, {
      'pref-lang': 'en',
    });

    render(<DashboardOpenEdxProfile />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    expect(
      await screen.findByText('An error occurred while fetching your profile. Please retry later.'),
    ).toBeInTheDocument();
  });

  it('should display get error when preferences request fail', async () => {
    const richieUser = UserFactory().one();
    const openEdxProfile = OpenEdxApiProfileFactory({
      username: richieUser.username,
      email: richieUser.email,
      name: richieUser.full_name,
    }).one();

    const { 'pref-lang': prefLang, ...openEdxAccount } = openEdxProfile;

    fetchMock.get(
      `https://endpoint.test/api/user/v1/accounts/${richieUser.username}`,
      openEdxAccount,
    );
    fetchMock.get(
      `https://endpoint.test/api/user/v1/preferences/${richieUser.username}`,
      new Response('', { status: HttpStatusCode.NOT_FOUND }),
    );

    render(<DashboardOpenEdxProfile />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    expect(
      await screen.findByText('An error occurred while fetching your profile. Please retry later.'),
    ).toBeInTheDocument();
  });
});
