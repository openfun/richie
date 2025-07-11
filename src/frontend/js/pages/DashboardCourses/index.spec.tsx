import { act, getByRole, screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import fetchMock from 'fetch-mock';
import userEvent from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import {
  OfferingFactory,
  EnrollmentFactory,
  CredentialOrderFactory,
} from 'utils/test/factories/joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { CourseLight, Offering, Enrollment, CredentialOrder } from 'types/Joanie';
import { expectNoSpinner, expectSpinner } from 'utils/test/expectSpinner';
import { expectBannerError, expectBannerInfo, expectNoBannerInfo } from 'utils/test/expectBanner';
import { Deferred } from 'utils/test/deferred';
import { isOrder } from 'pages/DashboardCourses/useOrdersEnrollments';
import { noop } from 'utils';
import { PER_PAGE } from 'settings';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';

import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';

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
  setupJoanieSession();
  const perPage = PER_PAGE.useOrdersEnrollments;

  const mockOrders = (orders: CredentialOrder[], client?: QueryClient) => {
    const offerings: Record<string, Offering> = {};
    orders.forEach((order) => {
      const productId = order.product_id;
      const courseCode = (order.course as CourseLight).code;
      const offering = OfferingFactory().one();

      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/courses/${courseCode}/products/${productId}/`,
        offering,
      );

      // Allowing this option boosts the test performances. Without it, the tests case with 200+
      // items was taking ~60s to complete.
      if (client) {
        client.setQueryData(
          ['courses-products', JSON.stringify({ id: courseCode, productId })],
          offering,
        );
      }
      offerings[order.id] = offering;
    });
    orders.sort((a, b) => {
      const aDate = new Date(a.created_on);
      const bDate = new Date(b.created_on);
      return bDate.getTime() - aDate.getTime();
    });
    return { orders, offerings };
  };

  const expectList = (
    entities: (CredentialOrder | Enrollment)[],
    offerings: Record<string, Offering>,
  ) => {
    const itemElements = document.querySelectorAll<HTMLElement>('.dashboard__courses__list__item');
    expect(itemElements.length).toBe(entities.length);
    entities.forEach((entity, i) => {
      const title = isOrder(entity)
        ? offerings[entity.id].product.title
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
      'https://joanie.endpoint/api/v1.0/orders/' +
        '?product_type=credential' +
        '&state_exclude=canceled' +
        '&state_exclude=refunding' +
        '&state_exclude=refunded' +
        '&page=1' +
        `&page_size=${perPage}`,
      ordersDeferred.promise,
    );
    const enrollmentsDeferred = new Deferred();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/enrollments/?was_created_by_order=false&is_active=true&page=1&page_size=${perPage}`,
      enrollmentsDeferred.promise,
    );

    render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
      wrapper: BaseJoanieAppWrapper,
    });

    await expectSpinner('Loading orders and enrollments...');
    expect(await screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    await expectNoBannerInfo('You have no enrollments nor orders yet');

    act(() => {
      ordersDeferred.resolve({ results: [], next: null, previous: null, count: 0 });
      enrollmentsDeferred.resolve({ results: [], next: null, previous: null, count: 0 });
    });

    // await expectNoSpinner('Loading orders and enrollments...');
    await expectBannerInfo('You have no enrollments nor orders yet.');
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
    const { orders, offerings } = mockOrders(
      CredentialOrderFactory().many(perPage * 2 + 1),
      client,
    );
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/orders/' +
        '?product_type=credential' +
        '&state_exclude=canceled' +
        '&state_exclude=refunding' +
        '&state_exclude=refunded' +
        '&page=1' +
        `&page_size=${perPage}`,
      {
        results: orders.slice(0, perPage),
        next:
          'https://joanie.endpoint/api/v1.0/orders/' +
          '?product_type=credential' +
          '&state_exclude=canceled' +
          '&state_exclude=refunding' +
          '&state_exclude=refunded' +
          '&page=2' +
          `&page_size=${perPage}`,
        previous: null,
        count: orders.length,
      },
    );
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/orders/' +
        '?product_type=credential' +
        '&state_exclude=canceled' +
        '&state_exclude=refunding' +
        '&state_exclude=refunded' +
        '&page=2' +
        `&page_size=${perPage}`,
      {
        results: orders.slice(perPage, perPage * 2),
        next:
          'https://joanie.endpoint/api/v1.0/orders/' +
          '?product_type=credential' +
          '&state_exclude=canceled' +
          '&state_exclude=refunding' +
          '&state_exclude=refunded' +
          '&page=3' +
          `&page_size=${perPage}`,
        previous: null,
        count: orders.length,
      },
    );
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/orders/' +
        '?product_type=credential' +
        '&state_exclude=canceled' +
        '&state_exclude=refunding' +
        '&state_exclude=refunded' +
        '&page=3' +
        `&page_size=${perPage}`,
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
      `https://joanie.endpoint/api/v1.0/enrollments/?was_created_by_order=false&is_active=true&page=1&page_size=${perPage}`,
      {
        results: enrollments.slice(0, perPage),
        next: `https://joanie.endpoint/api/v1.0/enrollments/?was_created_by_order=false&is_active=true&page=2&page_size=${perPage}`,
        previous: null,
        count: enrollments.length,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/enrollments/?was_created_by_order=false&is_active=true&page=2&page_size=${perPage}`,
      {
        results: enrollments.slice(perPage, perPage * 2),
        next: `https://joanie.endpoint/api/v1.0/enrollments/?was_created_by_order=false&page=3&page_size=${perPage}`,
        previous: null,
        count: enrollments.length,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/enrollments/?was_created_by_order=false&is_active=true&page=3&page_size=${perPage}`,
      {
        results: enrollments.slice(perPage * 2, perPage * 3),
        next: null,
        previous: null,
        count: enrollments.length,
      },
    );

    const entities = merge(orders, enrollments);

    render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
      wrapper: BaseJoanieAppWrapper,
    });

    // Slice 1.
    await expectNoSpinner('Loading orders and enrollments...');
    await expectNoBannerInfo('You have no enrollments nor orders yet');
    let loadMoreButton = await screen.findByRole('button', { name: 'Load more' });
    expect(loadMoreButton).toBeEnabled();
    await waitFor(() => expectList(entities.slice(0, perPage), offerings), { interval: 200 });

    // Click on load more button to load slice 2.
    await act(async () => userEvent.click(loadMoreButton));
    await waitFor(() => expectList(entities.slice(0, perPage * 2), offerings));
    loadMoreButton = await screen.findByRole('button', { name: 'Load more' });
    expect(loadMoreButton).toBeEnabled();

    // Activate intersection observe to load slice 3.
    const { onIntersect } = (globalThis as any).__intersection_observer_props__;
    await waitFor(async () => onIntersect());
    await waitFor(() => expectList(entities.slice(0, perPage * 3), offerings), { timeout: 30000 });
    loadMoreButton = await screen.findByRole('button', { name: 'Load more' });
    expect(loadMoreButton).toBeEnabled();
  }, 15000);

  it('shows an error', async () => {
    jest.spyOn(console, 'error').mockImplementation(noop);
    const ordersDeferred = new Deferred();
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/orders/' +
        '?product_type=credential' +
        '&state_exclude=canceled' +
        '&state_exclude=refunding' +
        '&state_exclude=refunded' +
        '&page=1' +
        `&page_size=${perPage}`,
      ordersDeferred.promise,
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/enrollments/?was_created_by_order=false&is_active=true&page=1&page_size=${perPage}`,
      { results: [], next: null, previous: null, count: 0 },
    );

    render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
      wrapper: BaseJoanieAppWrapper,
    });

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
