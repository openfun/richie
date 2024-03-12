import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { StringHelper } from 'utils/StringHelper';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { ContractFactory, OrganizationFactory } from 'utils/test/factories/joanie';
import { PER_PAGE } from 'settings';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { TeacherDashboardOrganizationSidebar } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('<TeacherDashboardOrganizationSidebar />', () => {
  setupJoanieSession();

  it('should render', async () => {
    const organization = OrganizationFactory({ logo: null }).one();

    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/organizations/' + organization.id + '/',
      organization,
    );
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/organizations/' +
        organization.id +
        `/contracts/?signature_state=half_signed&page=1&page_size=${PER_PAGE.teacherContractList}`,
      { results: [], count: 0, previous: null, next: null },
    );

    render(<TeacherDashboardOrganizationSidebar />, {
      routerOptions: { path: '/:organizationId', initialEntries: [`/${organization.id}`] },
    });

    await expectNoSpinner('Loading organization...');

    // It should display an avatar according to the organization title if there is no logo
    expect(screen.getByTestId('dashboard-avatar')).toHaveTextContent(
      StringHelper.abbreviate(organization.title, 3),
    );

    screen.getByText('You are on the organization dashboard');

    // It should display menu links
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent('Courses');
    expect(links[1]).toHaveTextContent('Contracts');
    // No badge should be displayed next to contract link
    expect(links[1].nextSibling).toBeNull();
  });

  it('should display contracts count badge if there are contracts to sign and user has abilities to sign', async () => {
    const organization = OrganizationFactory().one();
    const contractToSignCount = faker.number.int({ min: 1, max: 5 });

    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/organizations/' + organization.id + '/',
      organization,
    );
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/organizations/' +
        organization.id +
        `/contracts/?signature_state=half_signed&page=1&page_size=${PER_PAGE.teacherContractList}`,
      {
        results: ContractFactory({ abilities: { sign: true } }).many(contractToSignCount),
        count: contractToSignCount,
        previous: null,
        next: null,
      },
    );

    render(<TeacherDashboardOrganizationSidebar />, {
      routerOptions: { path: '/:organizationId', initialEntries: [`/${organization.id}`] },
    });
    await expectNoSpinner('Loading organization...');

    // It should display contract link with badge next to it displaying the number of contracts to sign
    const contractLink = screen.getByRole('link', { name: 'Contracts' });
    await waitFor(() => {
      expect(contractLink!.nextSibling).toHaveTextContent(contractToSignCount.toString());
    });
    expect(contractLink).toHaveAttribute(
      'href',
      '/teacher/organizations/' + organization.id + '/contracts?signature_state=half_signed',
    );
  });

  it('should not display contracts count badge if there are contracts to sign but the user has abilities to sign', async () => {
    const organization = OrganizationFactory().one();
    const contractToSignCount = faker.number.int({ min: 1, max: 5 });

    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/organizations/' + organization.id + '/',
      organization,
    );
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/organizations/' +
        organization.id +
        `/contracts/?signature_state=half_signed&page=1&page_size=${PER_PAGE.teacherContractList}`,
      {
        results: ContractFactory({ abilities: { sign: false } }).many(contractToSignCount),
        count: contractToSignCount,
        previous: null,
        next: null,
      },
    );

    render(<TeacherDashboardOrganizationSidebar />, {
      routerOptions: { path: '/:organizationId', initialEntries: [`/${organization.id}`] },
    });
    await expectNoSpinner('Loading organization...');

    // It should display contract link with no badge next to it
    const contractLink = screen.getByRole('link', { name: 'Contracts' });
    expect(contractLink!.nextSibling).toBeNull();
    expect(contractLink).toHaveAttribute(
      'href',
      '/teacher/organizations/' + organization.id + '/contracts?signature_state=signed',
    );
  });
});
