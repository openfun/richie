import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import userEvent from '@testing-library/user-event';
import * as mockFactories from 'utils/test/factories';
import { History, HistoryContext } from 'hooks/useHistory';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { JoanieEnrollmentFactory } from 'utils/test/factories';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { SessionProvider } from 'contexts/SessionContext';
import { DashboardPaths } from 'widgets/Dashboard/utils/routers';
import { Enrollment } from 'types/Joanie';
import { resolveAll } from 'utils/resolveAll';
import { expectNoSpinner, expectSpinner } from 'utils/test/expectSpinner';
import { expectBannerError } from 'utils/test/expectBannerError';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
      joanie_backend: { endpoint: 'https://joanie.endpoint' },
    })
    .generate(),
}));

jest.mock('utils/indirection/window', () => ({
  location: {},
  scroll: jest.fn(),
}));

describe('<DashboardCourses/>', () => {
  const historyPushState = jest.fn();
  const historyReplaceState = jest.fn();
  const makeHistoryOf: (params: any) => History = () => [
    {
      state: { name: '', data: {} },
      title: '',
      url: `/`,
    },
    historyPushState,
    historyReplaceState,
  ];

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('renders 3 pages of enrollments', async () => {
    const enrollments: Enrollment[] = JoanieEnrollmentFactory.generate(30);
    const enrollmentsPage1 = enrollments.slice(0, 10);
    const enrollmentsPage2 = enrollments.slice(10, 20);

    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/enrollments/?page=1&page_size=10&was_created_by_order=false',
      { results: enrollmentsPage1, next: null, previous: null, count: 30 },
    );

    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/enrollments/?page=2&page_size=10&was_created_by_order=false',
      { results: enrollmentsPage2, next: null, previous: null, count: 30 },
    );

    render(
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({})}>
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.COURSES} />
            </SessionProvider>
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
    );

    // Make sure the spinner appear during first load.
    await expectSpinner('Loading orders and enrollments...');

    await expectNoSpinner('Loading orders and enrollments...');

    // Make sure the first page is loaded.
    expect(document.querySelector('.dashboard__courses__list--loading')).toBeNull();
    await screen.findByText('Currently reading page 1');
    await resolveAll(enrollmentsPage1, async (enrollment) => {
      await screen.findByRole('heading', { level: 5, name: enrollment.course_run.course?.title });
    });

    // Go to page 2.
    await userEvent.click(screen.getByText('Next page 2'));

    // Make sure the loading class is set.
    expect(document.querySelector('.dashboard__courses__list--loading')).toBeDefined();

    // Make sure the second page is loaded.
    await screen.findByText('Currently reading page 2');
    await resolveAll(enrollmentsPage2, async (enrollment) => {
      await screen.findByRole('heading', { level: 5, name: enrollment.course_run.course?.title });
    });

    // Go back to page 1.
    await userEvent.click(screen.getByText('Previous page 1'));

    await screen.findByText('Currently reading page 1');
    await resolveAll(enrollmentsPage1, async (enrollment) => {
      await screen.findByRole('heading', { level: 5, name: enrollment.course_run.course?.title });
    });
  });

  it('shows an error', async () => {
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/enrollments/?page=1&page_size=10&was_created_by_order=false',
      { status: 500, body: 'Internal error' },
    );

    render(
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({})}>
            <SessionProvider>
              <DashboardTest initialRoute={DashboardPaths.COURSES} />
            </SessionProvider>
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>,
    );

    // Make sure error is shown.
    await expectBannerError('An error occurred while fetching enrollments. Please retry later.');

    // ... and the spinner hidden.
    await expectNoSpinner('Loading ...');
  });
});
