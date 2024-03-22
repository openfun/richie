import fetchMock from 'fetch-mock';
import { screen } from '@testing-library/react';
import { createIntl } from 'react-intl';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { OrganizationFactory } from 'utils/test/factories/joanie';
import { messages as organizationLinksMessages } from 'widgets/Dashboard/components/TeacherDashboardProfileSidebar/components/OrganizationLinks';
import { render } from 'utils/test/render';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import {
  TEACHER_DASHBOARD_ROUTE_LABELS,
  TeacherDashboardPaths,
} from 'widgets/Dashboard/utils/teacherDashboardPaths';
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
  const joanieSessionData = setupJoanieSession();

  let nbApiRequest: number;
  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', []);
    nbApiRequest = joanieSessionData.nbSessionApiRequest;
  });

  it('should display menu items', async () => {
    nbApiRequest += 1; // call to organizations
    render(<TeacherDashboardProfileSidebar />);

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
    render(<TeacherDashboardProfileSidebar />);
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
