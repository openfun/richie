import fetchMock from 'fetch-mock';
import { screen } from '@testing-library/react';
import { getAllByRole } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import {
  ContractFactory,
  CourseProductRelationFactory,
  OrganizationFactory,
} from 'utils/test/factories/joanie';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { expectBannerError } from 'utils/test/expectBanner';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import TeacherDashboardContracts from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('components/ContractFrame', () => ({
  __esModule: true,
  OrganizationContractFrame: ({
    isOpen,
    organizationId,
  }: {
    isOpen: boolean;
    organizationId: string;
  }) => isOpen && <p>ContractFrame opened for {organizationId}</p>,
}));

describe('pages/TeacherDashboardContracts', () => {
  setupJoanieSession();

  it('should render a list of contracts for a course product relation', async () => {
    const courseProductRelation = CourseProductRelationFactory().one();
    const contracts = ContractFactory({
      student_signed_on: Date.toString(),
      organization_signed_on: Date.toString(),
    }).many(3);
    const organizations = OrganizationFactory().many(2);
    const defaultOrganization = organizations[0];

    // OrganizationContractFilter request all organizations forwho the user have access
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/?course_product_relation_id=${courseProductRelation.id}`,
      organizations,
    );
    // TeacherDashboardContracts request a paginated list of contracts to display
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/${defaultOrganization.id}/contracts/?course_product_relation_id=${courseProductRelation.id}&signature_state=signed&page=1&page_size=25`,
      { results: contracts, count: 0, previous: null, next: null },
    );
    // useTeacherContractsToSign request all contract to sign, without pagination
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/${defaultOrganization.id}/contracts/?signature_state=half_signed&course_product_relation_id=${courseProductRelation.id}`,
      { results: [], count: 0, previous: null, next: null },
    );

    render(<TeacherDashboardContracts />, {
      routerOptions: {
        path: '/courses/:courseId/products/:courseProductRelationId/contracts',
        initialEntries: [
          `/courses/${courseProductRelation.course.id}/products/${courseProductRelation.id}/contracts`,
        ],
      },
    });

    await expectNoSpinner();

    // Organization filter should have been rendered
    const organizationFilter: HTMLInputElement = await screen.findByRole('combobox', {
      name: 'Organization',
    });
    expect(organizationFilter).toHaveAttribute('value', defaultOrganization.title);

    // Signature state filter should have been rendered
    const signatureStateFilter: HTMLInputElement = screen.getByRole('combobox', {
      name: 'Signature state',
      hidden: true,
    });
    const value = (signatureStateFilter.querySelector('input[type="hidden"]') as HTMLInputElement)
      ?.value;
    expect(value).toBe('signed');

    await expectNoSpinner();

    // Table listing all signed contracts should have been rendered
    screen.getByRole('table');

    // Table header should have been rendered with 3 columns
    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders.length).toBe(3);
    expect(columnHeaders[0]).toHaveTextContent('Training');
    expect(columnHeaders[1]).toHaveTextContent('Learner');
    expect(columnHeaders[2]).toHaveTextContent('State');

    // Table body should have been rendered with 3 rows (one per contract)
    contracts.forEach((contract) => {
      const row = screen.getByTestId(contract.id);
      const cells = getAllByRole(row, 'cell');
      expect(cells.length).toBe(3);
      expect(cells[0]).toHaveTextContent(contract.order.product_title);
      expect(cells[1]).toHaveTextContent(contract.order.owner_name);
      expect(cells[2]).toHaveTextContent('Signed');
    });
  });

  it('should render a list of contracts for an organization', async () => {
    const contracts = ContractFactory({
      student_signed_on: Date.toString(),
      organization_signed_on: Date.toString(),
    }).many(3);

    // OrganizationContractFilter request all organizations forwho the user have access
    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/`, []);

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=signed&page=1&page_size=25`,
      { results: contracts, count: 0, previous: null, next: null },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=half_signed`,
      { results: [], count: 0, previous: null, next: null },
    );

    render(<TeacherDashboardContracts />, {
      routerOptions: {
        path: '/organizations/:organizationId/contracts',
        initialEntries: ['/organizations/1/contracts'],
      },
    });

    await expectNoSpinner();

    // Organization filter should not have been rendered
    const organizationFilter = screen.queryByRole('combobox', {
      name: 'Organization',
    });
    expect(organizationFilter).not.toBeInTheDocument();

    // Signature state filter should have been rendered
    const signatureStateFilter: HTMLInputElement = screen.getByRole('combobox', {
      name: 'Signature state',
      hidden: true,
    });
    const value = (signatureStateFilter.querySelector('input[type="hidden"]') as HTMLInputElement)
      ?.value;
    expect(value).toBe('signed');

    await expectNoSpinner();

    // Table listing all signed contracts should have been rendered
    screen.getByRole('table');

    // Table header should have been rendered with 3 columns
    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders.length).toBe(3);

    // Table body should have been rendered with 3 rows (one per contract)
    contracts.forEach((contract) => {
      const row = screen.getByTestId(contract.id);
      const cells = getAllByRole(row, 'cell');
      expect(cells.length).toBe(3);
      expect(cells[0]).toHaveTextContent(contract.order.product_title);
      expect(cells[1]).toHaveTextContent(contract.order.owner_name);
      expect(cells[2]).toHaveTextContent('Signed');
    });
  });

  it('should render an empty table if there are no contracts', async () => {
    // OrganizationContractFilter request all organizations forwho the user have access
    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/`, []);
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=signed&page=1&page_size=25`,
      { results: [], count: 0, previous: null, next: null },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=half_signed`,
      { results: [], count: 0, previous: null, next: null },
    );

    render(<TeacherDashboardContracts />, {
      routerOptions: {
        path: '/organizations/:organizationId/contracts',
        initialEntries: ['/organizations/1/contracts'],
      },
    });

    await expectNoSpinner();

    // Organization filter should not have been rendered
    const organizationFilter = screen.queryByRole('combobox', {
      name: 'Organization',
    });
    expect(organizationFilter).not.toBeInTheDocument();

    // Signature state filter should have been rendered
    const signatureStateFilter: HTMLInputElement = screen.getByRole('combobox', {
      name: 'Signature state',
      hidden: true,
    });
    const value = (signatureStateFilter.querySelector('input[type="hidden"]') as HTMLInputElement)
      ?.value;
    expect(value).toBe('signed');

    await expectNoSpinner();

    // A message should have been rendered to inform the user that there are no contracts
    screen.getByRole('img', { name: /illustration of an empty table/i });
    screen.getByText(/this table is empty/i);
  });

  it('should render a button to bulk sign contracts if user has abilities and there are contracts to sign', async () => {
    const contracts = ContractFactory({
      student_signed_on: Date.toString(),
      abilities: { sign: true },
    }).many(3);

    // OrganizationContractFilter request all organizations forwho the user have access
    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/`, []);
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=signed&page=1&page_size=25`,
      { results: [], count: 0, previous: null, next: null },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=half_signed&page=1&page_size=25`,
      { results: contracts, count: 3, previous: null, next: null },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=half_signed`,
      { results: contracts, count: 3, previous: null, next: null },
    );

    render(<TeacherDashboardContracts />, {
      routerOptions: {
        path: '/organizations/:organizationId/contracts',
        initialEntries: ['/organizations/1/contracts?signature_state=half_signed'],
      },
    });

    await expectNoSpinner();

    // Organization filter should not have been rendered
    const organizationFilter = screen.queryByRole('combobox', {
      name: 'Organization',
    });
    expect(organizationFilter).not.toBeInTheDocument();

    // Signature state filter should have been rendered
    const signatureStateFilter: HTMLInputElement = screen.getByRole('combobox', {
      name: 'Signature state',
      hidden: true,
    });
    const value = (signatureStateFilter.querySelector('input[type="hidden"]') as HTMLInputElement)
      ?.value;
    expect(value).toBe('half_signed');

    // Table listing all signed contracts should have been rendered
    screen.getByRole('table');

    // Table header should have been rendered with 3 columns
    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders.length).toBe(3);

    // Table body should have been rendered with 3 rows (one per contract)
    contracts.forEach((contract) => {
      const row = screen.getByTestId(contract.id);
      const cells = getAllByRole(row, 'cell');
      expect(cells.length).toBe(3);
      expect(cells[2]).toHaveTextContent('Pending for signature');
    });

    // OrganizationContractFrame should not be opened yet
    expect(screen.queryByText('ContractFrame opened for 1')).not.toBeInTheDocument();

    // Bulk sign button should have been rendered
    const bulkSignButton = screen.getByRole('button', {
      name: 'Sign all pending contracts (3)',
    });
    const user = userEvent.setup();
    await user.click(bulkSignButton);

    // And now OrganizationContractFrame should be opened
    screen.getByText('ContractFrame opened for 1');
  });

  it('should render an error banner if an error occured during contracts fetching', async () => {
    // OrganizationContractFilter request all organizations forwho the user have access
    fetchMock.get(`https://joanie.endpoint/api/v1.0/organizations/`, []);

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=signed&page=1&page_size=25`,
      HttpStatusCode.NOT_FOUND,
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/1/contracts/?signature_state=half_signed`,
      HttpStatusCode.NOT_FOUND,
    );

    render(<TeacherDashboardContracts />, {
      routerOptions: {
        path: '/organizations/:organizationId/contracts',
        initialEntries: ['/organizations/1/contracts'],
      },
    });

    await expectNoSpinner();
    await expectBannerError('An error occurred while fetching contracts. Please retry later.');
  });

  it('should hide organization filter when user only have one organization', async () => {
    const defaultOrganization = OrganizationFactory().one();
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', [defaultOrganization]);

    const contracts = ContractFactory({
      student_signed_on: Date.toString(),
      abilities: { sign: true },
    }).many(3);
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/${defaultOrganization.id}/contracts/?signature_state=signed&page=1&page_size=25`,
      { results: [], count: 0, previous: null, next: null },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/organizations/${defaultOrganization.id}/contracts/?signature_state=half_signed`,
      { results: contracts, count: 3, previous: null, next: null },
    );

    render(<TeacherDashboardContracts />, {
      routerOptions: {
        path: '/',
        initialEntries: ['/'],
      },
    });

    await expectNoSpinner();

    // Signature state filter should have been rendered
    screen.getByRole('combobox', {
      name: 'Signature state',
      hidden: true,
    });

    // Organization filter should not have been rendered
    const organizationFilter = screen.queryByRole('combobox', { name: 'Organization' });
    expect(organizationFilter).not.toBeInTheDocument();
  });
});
