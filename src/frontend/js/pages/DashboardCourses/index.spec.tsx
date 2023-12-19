import { act, getByRole, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import userEvent from '@testing-library/user-event';
import {
  UserFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import { History, HistoryContext } from 'hooks/useHistory';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import {
  CourseProductRelationFactory,
  EnrollmentFactory,
  CredentialOrderFactory,
} from 'utils/test/factories/joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { SessionProvider } from 'contexts/SessionContext';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { CourseLight, CourseProductRelation, Enrollment, CredentialOrder } from 'types/Joanie';
import { expectNoSpinner, expectSpinner } from 'utils/test/expectSpinner';
import { expectBannerError, expectBannerInfo, expectNoBannerInfo } from 'utils/test/expectBanner';
import { Deferred } from 'utils/test/deferred';
import { isOrder } from 'pages/DashboardCourses/useOrdersEnrollments';
import { noop } from 'utils';
import { PER_PAGE } from 'settings';
import { HttpStatusCode } from 'utils/errors/HttpError';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('settings', () => ({
  __esModule: true,
  ...jest.requireActual('settings'),
  PER_PAGE: { useOrdersEnrollments: 4 },
}));

jest.mock('utils/indirection/window', () => ({
  location: {},
  scroll: jest.fn(),
}));

jest.mock('hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: (props: any) => {
    (globalThis as any).__intersection_observer_props__ = props;
  },
}));

describe('<DashboardCourses/>', () => {
  const perPage = PER_PAGE.useOrdersEnrollments;
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

  const Wrapper = ({ client }: { client?: QueryClient }) => {
    const user = UserFactory().one();
    return (
      <QueryClientProvider client={client ?? createTestQueryClient({ user })}>
        <IntlProvider locale="en">
          <HistoryContext.Provider value={makeHistoryOf({})}>
            <SessionProvider>
              <DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />
            </SessionProvider>
          </HistoryContext.Provider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  const mockOrders = (orders: CredentialOrder[], client?: QueryClient) => {
    const relations: Record<string, CourseProductRelation> = {};
    orders.forEach((order) => {
      const productId = order.product_id;
      const courseCode = (order.course as CourseLight).code;
      const relation = CourseProductRelationFactory().one();

      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/courses/${courseCode}/products/${productId}/`,
        relation,
      );

      // Allowing this option boosts the test performances. Without it, the tests case with 200+
      // items was taking ~60s to complete.
      if (client) {
        client.setQueryData(
          ['courses-products', JSON.stringify({ id: courseCode, productId })],
          relation,
        );
      }
      relations[order.id] = relation;
    });
    orders.sort((a, b) => {
      const aDate = new Date(a.created_on);
      const bDate = new Date(b.created_on);
      return bDate.getTime() - aDate.getTime();
    });
    return { orders, relations };
  };

  const expectList = (
    entities: (CredentialOrder | Enrollment)[],
    relations: Record<string, CourseProductRelation>,
  ) => {
    const itemElements = document.querySelectorAll<HTMLElement>('.dashboard__courses__list__item');
    expect(itemElements.length).toBe(entities.length);
    entities.forEach((entity, i) => {
      const title = isOrder(entity)
        ? relations[entity.id].product.title
        : entity.course_run.course?.title;
      getByRole(itemElements[i], 'heading', {
        name: title,
        level: 5,
      });
    });
  };

  it('renders an empty placeholder', async () => {
    const ordersDeferred = new Deferred();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?product_type=credential&state_exclude=canceled&page=1&page_size=${perPage}`,
      ordersDeferred.promise,
    );
    const enrollmentsDeferred = new Deferred();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/enrollments/?was_created_by_order=false&page=1&page_size=${perPage}`,
      enrollmentsDeferred.promise,
    );

    render(<Wrapper />);

    await expectSpinner('Loading orders and enrollments...');
    expect(await screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    await expectNoBannerInfo('You have no enrollments nor orders yet');

    ordersDeferred.resolve({ results: [], next: null, previous: null, count: 0 });
    enrollmentsDeferred.resolve({ results: [], next: null, previous: null, count: 0 });

    await expectNoSpinner('Loading orders and enrollments...');
    expectBannerInfo('You have no enrollments nor orders yet.');
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  const merge = (orders: CredentialOrder[], enrollments: Enrollment[]) => {
    return [...orders, ...enrollments].sort((a, b) => {
      const aDate = new Date(a.created_on);
      const bDate = new Date(b.created_on);
      return bDate.getTime() - aDate.getTime();
    });
  };

  it('should render the list of entities', async () => {
    const client = createTestQueryClient({ user: true });
    const { orders, relations } = mockOrders(
      CredentialOrderFactory().many(perPage * 2 + 1),
      client,
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?product_type=credential&state_exclude=canceled&page=1&page_size=${perPage}`,
      {
        results: orders.slice(0, perPage),
        next: `https://joanie.endpoint/api/v1.0/orders/?product_type=credentia&state_exclude=canceled&page=2&page_size=${perPage}`,
        previous: null,
        count: orders.length,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?product_type=credential&state_exclude=canceled&page=2&page_size=${perPage}`,
      {
        results: orders.slice(perPage, perPage * 2),
        next: `https://joanie.endpoint/api/v1.0/orders/?product_type=credential&state_exclude=canceled&page=3&page_size=${perPage}`,
        previous: null,
        count: orders.length,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?product_type=credential&state_exclude=canceled&page=3&page_size=${perPage}`,
      {
        results: orders.slice(perPage * 2, perPage * 3),
        next: null,
        previous: null,
        count: orders.length,
      },
    );
    const enrollments: Enrollment[] = EnrollmentFactory().many(perPage * 2 + 2);
    enrollments.sort((a, b) => {
      const aDate = new Date(a.created_on);
      const bDate = new Date(b.created_on);
      return bDate.getTime() - aDate.getTime();
    });

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/enrollments/?was_created_by_order=false&page=1&page_size=${perPage}`,
      {
        results: enrollments.slice(0, perPage),
        next: `https://joanie.endpoint/api/v1.0/enrollments/?was_created_by_order=false&page=2&page_size=${perPage}`,
        previous: null,
        count: enrollments.length,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/enrollments/?was_created_by_order=false&page=2&page_size=${perPage}`,
      {
        results: enrollments.slice(perPage, perPage * 2),
        next: `https://joanie.endpoint/api/v1.0/enrollments/?was_created_by_order=false&page=3&page_size=${perPage}`,
        previous: null,
        count: enrollments.length,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/enrollments/?was_created_by_order=false&page=3&page_size=${perPage}`,
      {
        results: enrollments.slice(perPage * 2, perPage * 3),
        next: null,
        previous: null,
        count: enrollments.length,
      },
    );

    const entities = merge(orders, enrollments);

    render(<Wrapper client={client} />);

    // Slice 1.
    await expectNoSpinner('Loading orders and enrollments...');
    await expectNoBannerInfo('You have no enrollments nor orders yet');
    let loadMoreButton = await screen.findByRole('button', { name: 'Load more' });
    expect(loadMoreButton).toBeEnabled();
    await waitFor(() => expectList(entities.slice(0, perPage), relations), { interval: 200 });

    // Click on load more button to load slice 2.
    await act(async () => userEvent.click(loadMoreButton));
    await waitFor(() => expectList(entities.slice(0, perPage * 2), relations));
    loadMoreButton = await screen.findByRole('button', { name: 'Load more' });
    expect(loadMoreButton).toBeEnabled();

    // Activate intersection observe to load slice 3.
    const { onIntersect } = (globalThis as any).__intersection_observer_props__;
    await waitFor(async () => onIntersect());
    await waitFor(() => expectList(entities.slice(0, perPage * 3), relations), { timeout: 30000 });
    loadMoreButton = await screen.findByRole('button', { name: 'Load more' });
    expect(loadMoreButton).toBeEnabled();
  });

  it('shows an error', async () => {
    jest.spyOn(console, 'error').mockImplementation(noop);
    const ordersDeferred = new Deferred();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?product_type=credential&state_exclude=canceled&page=1&page_size=${perPage}`,
      ordersDeferred.promise,
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/enrollments/?was_created_by_order=false&page=1&page_size=${perPage}`,
      { results: [], next: null, previous: null, count: 0 },
    );

    render(<Wrapper />);
    ordersDeferred.resolve({
      status: HttpStatusCode.INTERNAL_SERVER_ERROR,
      body: 'Internal Server Error',
    });

    await expectNoSpinner('Loading orders and enrollments...');
    await expectNoBannerInfo('You have no enrollments nor orders yet');
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    await expectBannerError(
      'An error occurred while fetching orders and enrollments. Please retry later.',
    );
  });
});
