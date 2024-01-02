import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { CunninghamProvider } from '@openfun/cunningham-react';
import fetchMock from 'fetch-mock';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { getAllByRole } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { ContractFactory, OrganizationFactory } from 'utils/test/factories/joanie';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { expectBannerError } from 'utils/test/expectBanner';
import { HttpError } from 'utils/errors/HttpError';
import TeacherDashboardContracts from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
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

const Wrapper = ({ path, initialEntry }: { path: string; initialEntry: string }) => {
  return (
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <JoanieSessionProvider>
          <CunninghamProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
              <Routes>
                <Route path={path} element={<TeacherDashboardContracts />} />
              </Routes>
            </MemoryRouter>
          </CunninghamProvider>
        </JoanieSessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );
};

describe('pages/TeacherDashboardContracts', () => {
  beforeAll(() => {
    const modalExclude = document.createElement('div');
    modalExclude.setAttribute('id', 'modal-exclude');
    document.body.appendChild(modalExclude);
  });

  beforeEach(() => {
    // Joanie providers calls
    fetchMock.get('https://joanie.test/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.test/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.test/api/v1.0/addresses/', []);
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('should render a list of contracts for a course product relation', async () => {
    const contracts = ContractFactory({
      student_signed_on: Date.toString(),
      organization_signed_on: Date.toString(),
    }).many(3);
    const organization = OrganizationFactory().one();

    fetchMock.get(`https://joanie.test/api/v1.0/organizations/`, [organization]);
    fetchMock.get(
      `https://joanie.test/api/v1.0/organizations/${organization.id}/contracts/?signature_state=signed&course_id=1&product_id=2&page=1&page_size=25`,
      { results: contracts, count: 0, previous: null, next: null },
    );
    fetchMock.get(
      `https://joanie.test/api/v1.0/organizations/${organization.id}/contracts/?signature_state=half_signed&course_id=1&product_id=2`,
      { results: [], count: 0, previous: null, next: null },
    );

    render(
      <Wrapper
        path="/courses/:courseId/products/:productId/contracts"
        initialEntry="/courses/1/products/2/contracts"
      />,
    );

    await expectNoSpinner();

    // Organization filter should have been rendered
    const organizationFilter: HTMLInputElement = screen.getByRole('combobox', {
      name: 'Organization',
    });
    expect(organizationFilter).toHaveAttribute('value', organization.title);

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

    fetchMock.get(
      `https://joanie.test/api/v1.0/organizations/1/contracts/?signature_state=signed&page=1&page_size=25`,
      { results: contracts, count: 0, previous: null, next: null },
    );
    fetchMock.get(
      `https://joanie.test/api/v1.0/organizations/1/contracts/?signature_state=half_signed`,
      { results: [], count: 0, previous: null, next: null },
    );

    render(
      <Wrapper
        path="/organizations/:organizationId/contracts"
        initialEntry="/organizations/1/contracts"
      />,
    );

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
    fetchMock.get(
      `https://joanie.test/api/v1.0/organizations/1/contracts/?signature_state=signed&page=1&page_size=25`,
      { results: [], count: 0, previous: null, next: null },
    );
    fetchMock.get(
      `https://joanie.test/api/v1.0/organizations/1/contracts/?signature_state=half_signed`,
      { results: [], count: 0, previous: null, next: null },
    );

    render(
      <Wrapper
        path="/organizations/:organizationId/contracts"
        initialEntry="/organizations/1/contracts"
      />,
    );

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

    fetchMock.get(
      `https://joanie.test/api/v1.0/organizations/1/contracts/?signature_state=half_signed&page=1&page_size=25`,
      { results: contracts, count: 3, previous: null, next: null },
    );
    fetchMock.get(
      `https://joanie.test/api/v1.0/organizations/1/contracts/?signature_state=half_signed`,
      { results: contracts, count: 3, previous: null, next: null },
    );

    render(
      <Wrapper
        path="/organizations/:organizationId/contracts"
        initialEntry="/organizations/1/contracts?signature_state=half_signed"
      />,
    );

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
    fetchMock.get(
      `https://joanie.test/api/v1.0/organizations/1/contracts/?signature_state=signed&page=1&page_size=25`,
      () => {
        throw new HttpError(404, 'Not found');
      },
    );
    fetchMock.get(
      `https://joanie.test/api/v1.0/organizations/1/contracts/?signature_state=half_signed`,
      () => {
        throw new HttpError(404, 'Not found');
      },
    );

    render(
      <Wrapper
        path="/organizations/:organizationId/contracts"
        initialEntry="/organizations/1/contracts"
      />,
    );

    await expectNoSpinner();
    await expectBannerError('An error occurred while fetching contracts. Please retry later.');
  });
});
