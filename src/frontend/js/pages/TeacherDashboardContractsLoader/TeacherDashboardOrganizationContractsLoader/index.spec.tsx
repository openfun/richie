import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { CunninghamProvider } from '@openfun/cunningham-react';
import fetchMock from 'fetch-mock';
import queryString from 'query-string';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { PER_PAGE } from 'settings';
import { ContractFactory, OrganizationFactory } from 'utils/test/factories/joanie';
import { ContractFilters } from 'types/Joanie';
import * as mockWindow from 'utils/indirection/window';
import { TeacherDashboardContractsProps } from '../TeacherDashboardContracts';
import { TeacherDashboardOrganizationContractsLoader } from '.';

jest.mock('utils/indirection/window', () => ({
  history: { pushState: jest.fn(), replaceState: jest.fn() },
  location: {},
}));

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

const Wrapper = ({ organizationId, page }: { organizationId: string; page: string }) => {
  const router = createMemoryRouter(
    [
      {
        path: `/:organizationId`,
        element: <TeacherDashboardOrganizationContractsLoader />,
      },
    ],
    { initialEntries: [`/${organizationId}?page=${page}`] },
  );
  return (
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <JoanieSessionProvider>
          <CunninghamProvider>
            <RouterProvider router={router} />
          </CunninghamProvider>
        </JoanieSessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );
};

describe('pages/TeacherDashboardOrganizationContractsLoader', () => {
  let nbApiCalls: number;
  let apiCallUrls: string[];
  const contractProps: TeacherDashboardContractsProps = {
    organizationId: 'FAKE_ORGANIZATION_ID',
    page: '10',
  };
  let apiFilters: ContractFilters;

  beforeEach(async () => {
    // Joanie providers calls
    fetchMock.get('https://joanie.test/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.test/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.test/api/v1.0/addresses/', []);
    nbApiCalls = 3;
    // Sidebar call
    fetchMock.get(
      `https://joanie.test/api/v1.0/organizations/${contractProps.organizationId}/`,
      OrganizationFactory().one(),
    );
    nbApiCalls += 1;
  });

  afterEach(() => {
    // Remove any keys added to the mockWindow location object, reset pathname to /search
    Object.keys(mockWindow.location).forEach((key) => delete (mockWindow.location as any)[key]);
    mockWindow.location.pathname = '';
    fetchMock.restore();
  });

  it('should request orders with contract route params and query params', async () => {
    apiFilters = {
      organization_id: contractProps.organizationId,
      page: parseInt(contractProps.page!, 10),
      page_size: PER_PAGE.teacherContractList,
    };
    fetchMock.get(`https://joanie.test/api/v1.0/contracts/?${queryString.stringify(apiFilters)}`, {
      count: 1,
      results: [ContractFactory().one()],
      next: null,
      previous: null,
    });
    mockWindow.location.pathname = `/${contractProps.organizationId}`;
    mockWindow.location.search = `?page=${contractProps.page!}`;
    render(<Wrapper organizationId={contractProps.organizationId!} page={contractProps.page!} />);
    nbApiCalls += 1;

    expect(await screen.findByTestId('contracts-loaded')).toBeInTheDocument();
    apiCallUrls = fetchMock.calls().map((call) => call[0]);

    expect(fetchMock.calls().length).toEqual(nbApiCalls);
    expect(apiCallUrls).toContain(
      'https://joanie.test/api/v1.0/contracts/?organization_id=FAKE_ORGANIZATION_ID&page=10&page_size=25',
    );
  });

  it('should not display organization select filter', async () => {
    apiFilters = {
      organization_id: contractProps.organizationId,
      page: contractProps.page ? parseInt(contractProps.page, 10) : undefined,
      page_size: PER_PAGE.teacherContractList,
    };

    fetchMock.get(`https://joanie.test/api/v1.0/contracts/?${queryString.stringify(apiFilters)}`, {
      count: 1,
      results: [ContractFactory().one()],
      next: null,
      previous: null,
    });
    mockWindow.location.pathname = `/${contractProps.organizationId}`;
    mockWindow.location.search = `?page=${contractProps.page!}`;
    render(<Wrapper organizationId={contractProps.organizationId!} page={contractProps.page!} />);
    expect(await screen.findByTestId('contracts-loaded')).toBeInTheDocument();
    expect(await screen.queryByRole('combobox', { name: /Organization/ })).not.toBeInTheDocument();
  });
});
