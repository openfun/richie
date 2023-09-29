import fetchMock from 'fetch-mock';
import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { IntlProvider, createIntl } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import { CunninghamProvider } from '@openfun/cunningham-react';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import {
  TEACHER_DASHBOARD_ROUTE_LABELS,
  TeacherDashboardPaths,
} from 'widgets/Dashboard/utils/teacherRouteMessages';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { OrganizationFactory } from 'utils/test/factories/joanie';
import { messages as organizationLinksMessages } from 'widgets/Dashboard/components/TeacherDashboardProfileSidebar/components/OrganizationLinks';

import { TeacherDashboardProfileSidebar } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  location: {
    replace: jest.fn(),
  },
}));

const intl = createIntl({ locale: 'en' });

describe('<TeacherDashboardProfileSidebar/>', () => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ user: UserFactory().one() })}>
        <JoanieSessionProvider>
          <MemoryRouter>
            <CunninghamProvider>{children}</CunninghamProvider>
          </MemoryRouter>
        </JoanieSessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );
  let nbApiRequest: number;
  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', []);

    // JoanieSessionProvider inital requests
    nbApiRequest = 3;
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
  });
  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('should display menu items', async () => {
    nbApiRequest += 1; // call to organizations
    render(
      <Wrapper>
        <TeacherDashboardProfileSidebar />
      </Wrapper>,
    );

    expect(
      screen.getByRole('link', {
        name: intl.formatMessage(
          TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.TEACHER_COURSES],
        ),
      }),
    ).toBeInTheDocument();

    expect(screen.queryByTestId('organization-links')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(fetchMock.calls()).toHaveLength(nbApiRequest);
  });

  it('should display organization links', async () => {
    const organizations = OrganizationFactory().many(3);
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', organizations, {
      overwriteRoutes: true,
    });
    nbApiRequest += 1; // call to organizations
    render(
      <Wrapper>
        <TeacherDashboardProfileSidebar />
      </Wrapper>,
    );
    expect(await screen.findByTestId('organization-links')).toBeInTheDocument();
    expect(fetchMock.calls()).toHaveLength(nbApiRequest);

    const [firstOrganization, secondOrganization, thirdOrganization] = organizations;
    expect(
      screen.getByTitle(
        intl.formatMessage(organizationLinksMessages.organizationLinkTitle, {
          organizationTitle: firstOrganization.title,
        }),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTitle(
        intl.formatMessage(organizationLinksMessages.organizationLinkTitle, {
          organizationTitle: secondOrganization.title,
        }),
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByTitle(
        intl.formatMessage(organizationLinksMessages.organizationLinkTitle, {
          organizationTitle: thirdOrganization.title,
        }),
      ),
    ).toBeInTheDocument();

    let nbExpectedLinks = 3; // menu items
    nbExpectedLinks += 1; // organization links
    expect(screen.getAllByRole('link')).toHaveLength(nbExpectedLinks);
  });
});
