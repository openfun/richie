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
import { EnrollmentFactory, OrderFactory, ProductFactory } from 'utils/test/factories/joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { SessionProvider } from 'contexts/SessionContext';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { CourseLight, Enrollment, Order, Product } from 'types/Joanie';
import { expectNoSpinner, expectSpinner } from 'utils/test/expectSpinner';
import { expectBannerError } from 'utils/test/expectBanner';
import { Deferred } from 'utils/test/deferred';
import { isOrder } from 'pages/DashboardCourses/useOrdersEnrollments';
import { PAGE_SIZE } from 'pages/DashboardCourses/constants';
import { noop } from 'utils';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('pages/DashboardCourses/constants', () => ({
  __esModule: true,
  PAGE_SIZE: 4,
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

  const mockOrders = (orders: Order[], client?: QueryClient) => {
    const products: Record<string, Product> = {};
    orders.forEach((order) => {
      const product: Product = ProductFactory().one();
      product.id = order.product;
      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/products/' +
          product.id +
          '/?course=' +
          (order.course as CourseLight).code,
        product,
      );

      // Allowing this option boosts the test performances. Without it, the tests case with 200+
      // items was taking ~60s to complete.
      if (client) {
        client.setQueryData(
          ['products', JSON.stringify({ id: product.id, course: order.course })],
          product,
        );
      }
      products[order.id] = product;
    });
    orders.sort((a, b) => {
      const aDate = new Date(a.created_on);
      const bDate = new Date(b.created_on);
      return bDate.getTime() - aDate.getTime();
    });
    return { orders, products };
  };

  const expectList = (entities: (Order | Enrollment)[], products: Record<string, Product>) => {
    const itemElements = document.querySelectorAll<HTMLElement>('.dashboard__courses__list__item');
    expect(itemElements.length).toBe(entities.length);
    entities.forEach((entity, i) => {
      const title = isOrder(entity) ? products[entity.id].title : entity.course_run.course?.title;
      getByRole(itemElements[i], 'heading', {
        name: title,
        level: 5,
      });
    });
  };

  it('renders an empty placeholder', async () => {
    const ordersDeferred = new Deferred();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?page=1&page_size=${PAGE_SIZE}`,
      ordersDeferred.promise,
    );
    const enrollmentsDeferred = new Deferred();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/enrollments/?page=1&page_size=${PAGE_SIZE}&was_created_by_order=false`,
      enrollmentsDeferred.promise,
    );

    render(<Wrapper />);

    await expectSpinner('Loading orders and enrollments...');
    const loadMoreButton = await screen.findByRole('button', { name: 'Load more' });
    expect(loadMoreButton).toBeDisabled();
    expect(screen.queryByText('You have no enrollments nor orders yet.')).not.toBeInTheDocument();

    ordersDeferred.resolve({ results: [], next: null, previous: null, count: 0 });
    enrollmentsDeferred.resolve({ results: [], next: null, previous: null, count: 0 });

    await expectNoSpinner('Loading orders and enrollments...');
    await screen.findByText('You have no enrollments nor orders yet.');
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  const merge = (orders: Order[], enrollments: Enrollment[]) => {
    return [...orders, ...enrollments].sort((a, b) => {
      const aDate = new Date(a.created_on);
      const bDate = new Date(b.created_on);
      return bDate.getTime() - aDate.getTime();
    });
  };

  it('should render the list of entities', async () => {
    const client = createTestQueryClient({ user: true });
    const { orders, products } = mockOrders(OrderFactory().many(PAGE_SIZE * 2 + 1), client);
    fetchMock.get(`https://joanie.endpoint/api/v1.0/orders/?page=1&page_size=${PAGE_SIZE}`, {
      results: orders.slice(0, PAGE_SIZE),
      next: `https://joanie.endpoint/api/v1.0/orders/?page=2&page_size=${PAGE_SIZE}`,
      prev: null,
      count: orders.length,
    });
    fetchMock.get(`https://joanie.endpoint/api/v1.0/orders/?page=2&page_size=${PAGE_SIZE}`, {
      results: orders.slice(PAGE_SIZE, PAGE_SIZE * 2),
      next: `https://joanie.endpoint/api/v1.0/orders/?page=3&page_size=${PAGE_SIZE}`,
      prev: null,
      count: orders.length,
    });
    fetchMock.get(`https://joanie.endpoint/api/v1.0/orders/?page=3&page_size=${PAGE_SIZE}`, {
      results: orders.slice(PAGE_SIZE * 2, PAGE_SIZE * 3),
      next: null,
      prev: null,
      count: orders.length,
    });
    const enrollments: Enrollment[] = EnrollmentFactory().many(PAGE_SIZE * 2 + 2);
    enrollments.sort((a, b) => {
      const aDate = new Date(a.created_on);
      const bDate = new Date(b.created_on);
      return bDate.getTime() - aDate.getTime();
    });

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/enrollments/?page=1&page_size=${PAGE_SIZE}&was_created_by_order=false`,
      {
        results: enrollments.slice(0, PAGE_SIZE),
        next: `https://joanie.endpoint/api/v1.0/enrollments/?page=2&page_size=${PAGE_SIZE}&was_created_by_order=false`,
        prev: null,
        count: enrollments.length,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/enrollments/?page=2&page_size=${PAGE_SIZE}&was_created_by_order=false`,
      {
        results: enrollments.slice(PAGE_SIZE, PAGE_SIZE * 2),
        next: `https://joanie.endpoint/api/v1.0/enrollments/?page=3&page_size=${PAGE_SIZE}&was_created_by_order=false`,
        prev: null,
        count: enrollments.length,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/enrollments/?page=3&page_size=${PAGE_SIZE}&was_created_by_order=false`,
      {
        results: enrollments.slice(PAGE_SIZE * 2, PAGE_SIZE * 3),
        next: null,
        prev: null,
        count: enrollments.length,
      },
    );

    const entities = merge(orders, enrollments);

    render(<Wrapper client={client} />);

    // Slice 1.
    await expectNoSpinner('Loading orders and enrollments...');
    expect(screen.queryByText('You have no enrollments nor orders yet.')).not.toBeInTheDocument();
    let loadMoreButton = await screen.findByRole('button', { name: 'Load more' });
    expect(loadMoreButton).toBeEnabled();
    await waitFor(() => expectList(entities.slice(0, PAGE_SIZE), products), { interval: 200 });

    // Click on load more button to load slice 2.
    await act(async () => userEvent.click(loadMoreButton));
    await waitFor(() => expectList(entities.slice(0, PAGE_SIZE * 2), products));
    loadMoreButton = await screen.findByRole('button', { name: 'Load more' });
    expect(loadMoreButton).toBeEnabled();

    // Activate intersection observe to load slice 3.
    const { onIntersect } = (globalThis as any).__intersection_observer_props__;
    await waitFor(async () => onIntersect());
    await waitFor(() => expectList(entities.slice(0, PAGE_SIZE * 3), products), { timeout: 30000 });
    loadMoreButton = await screen.findByRole('button', { name: 'Load more' });
    expect(loadMoreButton).toBeEnabled();
  });

  it('shows an error', async () => {
    jest.spyOn(console, 'error').mockImplementation(noop);
    const ordersDeferred = new Deferred();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?page=1&page_size=${PAGE_SIZE}`,
      ordersDeferred.promise,
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/enrollments/?page=1&page_size=${PAGE_SIZE}&was_created_by_order=false`,
      { results: [], next: null, previous: null, count: 0 },
    );

    render(<Wrapper />);
    ordersDeferred.resolve({
      status: 500,
      body: 'Bad request',
    });

    await expectNoSpinner('Loading orders and enrollments...');
    expect(screen.queryByText('You have no enrollments nor orders yet.')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    await expectBannerError(
      'An error occurred while fetching orders and enrollments. Please retry later.',
    );
  });
});
