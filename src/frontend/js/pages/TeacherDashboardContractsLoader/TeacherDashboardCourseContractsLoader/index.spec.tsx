import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { CunninghamProvider } from '@openfun/cunningham-react';
import fetchMock from 'fetch-mock';
import queryString from 'query-string';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { PER_PAGE } from 'settings';
import {
  ContractFactory,
  CourseListItemFactory,
  OrganizationFactory,
} from 'utils/test/factories/joanie';
import * as mockWindow from 'utils/indirection/window';
import { ContractFilters } from 'types/Joanie';
import { TeacherDashboardContractsProps } from '../TeacherDashboardContracts';
import { TeacherDashboardCourseContractsLoader } from '.';

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

const Wrapper = ({ courseId, page }: { courseId: string; page: string }) => {
  const router = createMemoryRouter(
    [
      {
        path: `/:courseId`,
        element: <TeacherDashboardCourseContractsLoader />,
      },
    ],
    { initialEntries: [`/${courseId}?page=${page}`] },
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

describe('pages/TeacherDashboardCourseContractsLoader', () => {
  let nbApiCalls: number;
  let apiCallUrls: string[];
  const contractProps: TeacherDashboardContractsProps = {
    courseId: 'FAKE_COURSE_ID',
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
      `https://joanie.test/api/v1.0/courses/${contractProps.courseId}/`,
      CourseListItemFactory().one(),
    );
    nbApiCalls += 1;
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('should request contract with current route params and query params', async () => {
    apiFilters = {
      course_id: contractProps.courseId,
      page: contractProps.page ? parseInt(contractProps.page, 10) : undefined,
      page_size: PER_PAGE.teacherContractList,
    };

    fetchMock.get('https://joanie.test/api/v1.0/organizations/', OrganizationFactory().many(5));
    fetchMock.get(`https://joanie.test/api/v1.0/contracts/?${queryString.stringify(apiFilters)}`, {
      count: 1,
      results: [ContractFactory().one()],
      next: null,
      previous: null,
    });
    mockWindow.location.pathname = `/${contractProps.courseId}`;
    mockWindow.location.search = `?page=${contractProps.page}`;
    render(<Wrapper courseId={contractProps.courseId!} page={contractProps.page!} />);
    nbApiCalls += 1; // get contracts
    nbApiCalls += 1; // get organizations, from ContractFilters

    expect(await screen.findByTestId('contracts-loaded')).toBeInTheDocument();
    expect(await screen.findByRole('combobox', { name: /Organization/ })).toBeInTheDocument();

    apiCallUrls = fetchMock.calls().map((call) => call[0]);
    expect(fetchMock.calls().length).toEqual(nbApiCalls);
    expect(apiCallUrls).toContain(
      'https://joanie.test/api/v1.0/contracts/?course_id=FAKE_COURSE_ID&page=10&page_size=25',
    );
  });

  it('should request contract when organization filter change', async () => {
    apiFilters = {
      course_id: contractProps.courseId,
      page: contractProps.page ? parseInt(contractProps.page, 10) : undefined,
      page_size: PER_PAGE.teacherContractList,
    };

    const organizationList = OrganizationFactory().many(5);
    fetchMock.get('https://joanie.test/api/v1.0/organizations/', organizationList);
    fetchMock.get(`https://joanie.test/api/v1.0/contracts/?${queryString.stringify(apiFilters)}`, {
      count: 1,
      results: [ContractFactory().one()],
      next: null,
      previous: null,
    });
    mockWindow.location.pathname = `/${contractProps.courseId}`;
    mockWindow.location.search = `?page=${contractProps.page}`;
    render(<Wrapper courseId={contractProps.courseId!} page={contractProps.page!} />);
    nbApiCalls += 1; // get contracts
    nbApiCalls += 1; // get organizations, from ContractFilters
    expect(await screen.findByTestId('contracts-loaded')).toBeInTheDocument();

    const contractUrlWithOrganizationFilter = `https://joanie.test/api/v1.0/contracts/?course_id=FAKE_COURSE_ID&organization_id=${organizationList[0].id}&page=10&page_size=25`;
    fetchMock.get(contractUrlWithOrganizationFilter, {
      count: 1,
      results: [ContractFactory().one()],
      next: null,
      previous: null,
    });
    const selectOrganizationFilter = await screen.findByRole('combobox', {
      name: /Organization/,
    });
    const user = userEvent.setup();
    await act(async () => {
      await user.click(selectOrganizationFilter);
    });

    // Filter on an organization
    await act(async () => {
      const option: HTMLLIElement = screen.getByRole('option', {
        name: organizationList[0].title,
      });
      await user.click(option);
    });
    nbApiCalls += 1; // get contracts with updated organization filter
    apiCallUrls = fetchMock.calls().map((call) => call[0]);
    expect(apiCallUrls).toContain(contractUrlWithOrganizationFilter);
    expect(fetchMock.calls().length).toEqual(nbApiCalls);
  });
});
