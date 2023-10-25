import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { CunninghamProvider } from '@openfun/cunningham-react';
import fetchMock from 'fetch-mock';
import queryString from 'query-string';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { PER_PAGE } from 'settings';
import { ContractFactory } from 'utils/test/factories/joanie';
import TeacherDashboardContracts from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

const Wrapper = ({ children }: PropsWithChildren) => {
  return (
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <JoanieSessionProvider>
          <CunninghamProvider>{children}</CunninghamProvider>
        </JoanieSessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );
};

describe('pages/TeacherDashboardContracts', () => {
  let nbApiCalls: number;
  beforeEach(() => {
    // Joanie providers calls
    fetchMock.get('https://joanie.test/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.test/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.test/api/v1.0/addresses/', []);
    nbApiCalls = 3;
  });

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it.each([
    {
      testLabel: 'all filters',
      filters: {
        courseId: 'FAKE_COURSE_ID',
        organizationId: 'FAKE_ORGANIZATION_ID',
        page: '1',
      },
    },
    {
      testLabel: 'no courseId',
      filters: {
        organizationId: 'FAKE_ORGANIZATION_ID',
        page: '1',
      },
    },
    {
      testLabel: 'no organizationId',
      filters: {
        courseId: 'FAKE_COURSE_ID',
        page: '1',
      },
    },
    {
      testLabel: 'no page',
      filters: {
        courseId: 'FAKE_COURSE_ID',
        organizationId: 'FAKE_ORGANIZATION_ID',
      },
    },
    {
      testLabel: 'page 10',
      filters: {
        page: '10',
      },
    },
  ])('should request contract with the right filters: $testLabel', async ({ filters }) => {
    const contractFilters = {
      course_id: filters.courseId,
      organization_id: filters.organizationId,
      page: filters.page || 1,
      page_size: PER_PAGE.teacherContractList,
    };

    const contractUrl = `https://joanie.test/api/v1.0/contracts/?${queryString.stringify(
      contractFilters,
    )}`;

    fetchMock.get(contractUrl, {
      count: 250,
      results: ContractFactory().many(PER_PAGE.teacherContractList),
      next: null,
      previous: null,
    });
    render(
      <Wrapper>
        <TeacherDashboardContracts {...filters} />
      </Wrapper>,
    );
    nbApiCalls += 1;
    expect(await screen.findByTestId('contracts-loaded')).toBeInTheDocument();

    const apiCallUrls = fetchMock.calls().map((call) => call[0]);
    expect(apiCallUrls).toContain(contractUrl);
    expect(apiCallUrls.length).toEqual(nbApiCalls);
  });

  it('should display contract row', async () => {
    const contractFilters = {
      courseId: 'FAKE_COURSE_ID',
      organizationId: 'FAKE_ORGANIZATION_ID',
    };
    const apiFilters = {
      course_id: contractFilters.courseId,
      organization_id: contractFilters.organizationId,
      page: 1,
      page_size: PER_PAGE.teacherContractList,
    };

    const contract = ContractFactory().one();
    fetchMock.get(`https://joanie.test/api/v1.0/contracts/?${queryString.stringify(apiFilters)}`, {
      count: 1,
      results: [contract],
      next: null,
      previous: null,
    });
    render(
      <Wrapper>
        <TeacherDashboardContracts {...contractFilters} />
      </Wrapper>,
    );
    nbApiCalls += 1;
    expect(await screen.findByTestId('contracts-loaded')).toBeInTheDocument();
    expect(screen.getByText(contract.order.owner)).toBeInTheDocument();
    expect(screen.getByText(contract.order.product)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Open/ })).toBeInTheDocument();
  });
});
