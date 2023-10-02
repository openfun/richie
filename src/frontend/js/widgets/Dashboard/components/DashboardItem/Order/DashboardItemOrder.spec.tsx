import {
  fireEvent,
  getByRole,
  getByTestId,
  getByText,
  queryByRole,
  queryByText,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { faker } from '@faker-js/faker';
import { QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren } from 'react';
import fetchMock from 'fetch-mock';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { DATETIME_FORMAT, DEFAULT_DATE_FORMAT } from 'hooks/useDateFormat';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import {
  CertificateFactory,
  CourseLightFactory,
  CourseRunFactory,
  EnrollmentFactory,
  OrderFactory,
  TargetCourseFactory,
} from 'utils/test/factories/joanie';
import { Certificate, CourseLight, CourseRun, Order, OrderState } from 'types/Joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { SessionProvider } from 'contexts/SessionContext';
import { resolveAll } from 'utils/resolveAll';
import { confirm } from 'utils/indirection/window';
import { Priority } from 'types';
import { sleep } from 'utils/sleep';
import { noop } from 'utils';
import { expectBannerError } from 'utils/test/expectBanner';
import { expectNoSpinner, expectSpinner } from 'utils/test/expectSpinner';
import { Deferred } from 'utils/test/deferred';
import { expectBreadcrumbsToEqualParts } from 'utils/test/expectBreadcrumbsToEqualParts';
import { mockCourseProductWithOrder } from 'utils/test/mockCourseProductWithOrder';
import { LearnerDashboardPaths } from '../../../utils/learnerRouteMessages';
import { DashboardTest } from '../../DashboardTest';
import { DashboardItemOrder } from './DashboardItemOrder';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  confirm: jest.fn(() => true),
}));

describe('<DashboardItemOrder/>', () => {
  const wrapper = ({ children }: PropsWithChildren) => {
    const router = createMemoryRouter([{ index: true, element: children }]);
    return (
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <SessionProvider>
            <RouterProvider router={router} />
          </SessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };
  const WrapperWithDashboard = (route: string) => {
    return (
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <SessionProvider>
            <DashboardTest initialRoute={route} />
          </SessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/enrollments/', []);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    fetchMock.restore();
  });

  /**
   * Global
   */

  it('crashes if no course is provided', async () => {
    const order: Order = { ...OrderFactory().one(), course: undefined };
    // Hide console.error ( https://stackoverflow.com/questions/66328549/testing-an-error-thrown-by-a-react-component-using-testing-library-and-jest )
    jest.spyOn(console, 'error').mockImplementation(noop);
    expect(() => render(<DashboardItemOrder order={order} />)).toThrow(
      'Order must provide course object attribute',
    );
  });

  it('renders a pending order', async () => {
    const order: Order = OrderFactory({ state: OrderState.PENDING }).one();
    order.target_courses = [];
    const { product } = mockCourseProductWithOrder(order);

    render(<DashboardItemOrder order={order} />, { wrapper });

    await screen.findByRole('heading', { level: 5, name: product.title });
    await screen.findByText('Ref. ' + (order.course as CourseLight).code);
    await screen.findByText('Pending');
    await screen.findByRole('link', { name: 'View details' });
  });

  it('renders an order with certificate', async () => {
    const order: Order = OrderFactory({ certificate: faker.string.uuid() }).one();
    order.target_courses = [];
    const { product } = mockCourseProductWithOrder(order);

    const certificate: Certificate = {
      ...CertificateFactory({
        id: order.certificate,
        order: { ...order, course: CourseLightFactory().one() },
      }).one(),
    };

    const deferred = new Deferred();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/certificates/${order.certificate}/`,
      deferred.promise,
    );

    render(<DashboardItemOrder order={order} showCertificate={true} />, { wrapper });

    await screen.findByRole('heading', { level: 5, name: product.title });
    await screen.findByText('Ref. ' + (order.course as CourseLight).code);
    await screen.findByText('Completed');
    await screen.findByRole('link', { name: 'View details' });
    await expectSpinner('Loading certificate...');
    deferred.resolve(certificate);
    await expectNoSpinner('Loading certificate...');
    await screen.findByText(certificate.certificate_definition.title);
  });

  it('does not render an order with certificate', async () => {
    const order: Order = OrderFactory({ certificate: faker.string.uuid() }).one();
    order.target_courses = [];
    const { product } = mockCourseProductWithOrder(order);

    render(<DashboardItemOrder order={order} />, { wrapper });

    await screen.findByRole('heading', { level: 5, name: product.title });
    await screen.findByText('Ref. ' + (order.course as CourseLight).code);
    await screen.findByText('Completed');
    await screen.findByRole('link', { name: 'View details' });
    await expectNoSpinner('Loading certificate ...');
  });

  /**
   * Non-Writable.
   */

  it('renders a non-writable order without target courses without certificate', async () => {
    const order: Order = OrderFactory().one();
    order.target_courses = [];
    const { product } = mockCourseProductWithOrder(order);

    render(<DashboardItemOrder order={order} />, { wrapper });

    await screen.findByRole('heading', { level: 5, name: product.title });
    await screen.findByText('Ref. ' + (order.course as CourseLight).code);
    await screen.findByText('On going');
    await screen.findByRole('link', { name: 'View details' });
  });

  it('renders a non-writable order with target courses', async () => {
    const order: Order = OrderFactory().one();
    const { product } = mockCourseProductWithOrder(order);

    render(<DashboardItemOrder order={order} />, { wrapper });

    await screen.findByRole('heading', { level: 5, name: product.title });
    await screen.findByText('Ref. ' + (order.course as CourseLight).code);
    await screen.findByText('On going');
    await resolveAll(order.target_courses, async (course) => {
      await screen.findByRole('heading', { level: 6, name: course.title });
    });
  });

  it('renders a non-writable order with enrolled target course ', async () => {
    const order: Order = OrderFactory({
      target_courses: TargetCourseFactory().many(1),
    }).one();

    // Make target course enrolled.
    order.target_enrollments = EnrollmentFactory({
      course_run: order.target_courses[0].course_runs[0],
    }).many(1);

    order.target_enrollments[0].course_run.state.priority = Priority.ONGOING_OPEN;

    const { product } = mockCourseProductWithOrder(order);

    render(<DashboardItemOrder order={order} />, { wrapper });

    await screen.findByRole('heading', { level: 5, name: product.title });
    await screen.findByText('Ref. ' + (order.course as CourseLight).code);
    await screen.findByText('On going');
    await resolveAll(order.target_courses, async (course) => {
      await screen.findByRole('heading', { level: 6, name: course.title });
      screen.getByText(
        'You are enrolled for the session from ' +
          new Intl.DateTimeFormat('en', DATETIME_FORMAT).format(
            new Date(order.target_enrollments[0].course_run.start),
          ) +
          ' to ' +
          new Intl.DateTimeFormat('en', DATETIME_FORMAT).format(
            new Date(order.target_enrollments[0].course_run.end),
          ),
      );
      screen.getByRole('link', { name: 'Access course' });
    });
  });
  it('renders a non-writable order with not enrolled target course', async () => {
    const order: Order = OrderFactory({
      target_courses: TargetCourseFactory().many(1),
      target_enrollments: [],
    }).one();

    const { product } = mockCourseProductWithOrder(order);

    render(<DashboardItemOrder order={order} />, { wrapper });

    await screen.findByRole('heading', { level: 5, name: product.title });
    await screen.findByText('Ref. ' + (order.course as CourseLight).code);
    await screen.findByText('On going');
    await resolveAll(order.target_courses, async (course) => {
      await screen.findByRole('heading', { level: 6, name: course.title });
      screen.getByText('You are not enrolled in this course');
      screen.getByRole('link', { name: 'Enroll' });
    });
  });

  /**
   * Writable.
   */

  it('renders a writable order with no target courses', async () => {
    const order: Order = OrderFactory().one();
    order.target_courses = [];
    const { product } = mockCourseProductWithOrder(order);

    render(<DashboardItemOrder order={order} writable={true} showDetailsButton={false} />, {
      wrapper,
    });

    await screen.findByRole('heading', { level: 5, name: product.title });
    await screen.findByText('Ref. ' + (order.course as CourseLight).code);
    await screen.findByText('On going');
    expect(screen.queryByRole('link', { name: 'View details' })).toBeNull();
  });

  it('renders a writable order with enrolled target course', async () => {
    const order: Order = OrderFactory({ target_courses: TargetCourseFactory().many(1) }).one();
    // Make target course enrolled.
    order.target_enrollments = [
      {
        ...EnrollmentFactory().one(),
        course_run: order.target_courses[0].course_runs[0],
      },
    ];

    const { product } = mockCourseProductWithOrder(order);

    render(<DashboardItemOrder order={order} writable={true} showDetailsButton={false} />, {
      wrapper,
    });

    await screen.findByRole('heading', { level: 5, name: product.title });
    await screen.findByText('Ref. ' + (order.course as CourseLight).code);
    await screen.findByText('On going');
    await resolveAll(order.target_courses, async (course) => {
      await screen.findByRole('heading', { level: 6, name: course.title });
      const container = screen.getByTestId('dashboard-item__course-enrolling__' + course.code);
      course.course_runs.forEach((courseRun, i) => {
        const runElement = getByTestId(
          container,
          'dashboard-item__course-enrolling__run__' + courseRun.id,
        );
        getByText(
          runElement,
          'From ' +
            new Intl.DateTimeFormat('en', DATETIME_FORMAT).format(new Date(courseRun.start)) +
            ' to ' +
            new Intl.DateTimeFormat('en', DATETIME_FORMAT).format(new Date(courseRun.end)),
        );
        // Expect the first courseRun to be enrolled but not the others.
        if (i === 0) {
          getByText(runElement, 'Enrolled');
          expect(queryByRole(runElement, 'button', { name: 'Enroll' })).toBeNull();
        } else {
          expect(queryByText(runElement, 'Enrolled')).toBeNull();
          getByRole(runElement, 'button', { name: 'Enroll' });
        }
      });
    });
  });

  it('renders a writable order with not enrolled target course and enrolls it', async () => {
    // Initial order without enrollment.
    const order: Order = OrderFactory({
      target_courses: TargetCourseFactory().many(1),
      target_enrollments: [],
    }).one();
    const { product } = mockCourseProductWithOrder(order);
    fetchMock.post('https://joanie.endpoint/api/v1.0/enrollments/', []);
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/orders/',
      { results: [order], next: null, previous: null, count: null },
      { overwriteRoutes: true },
    );

    // The order with an enrollment that will be returned from the API when the orders will be
    // invalided after the click on the Enroll button.
    const orderWithEnrollment = {
      ...order,
      target_enrollments: EnrollmentFactory({
        course_run: order.target_courses[0].course_runs[0],
      }).many(1),
    };

    render(WrapperWithDashboard(LearnerDashboardPaths.ORDER.replace(':orderId', order.id)));
    // Wait for the order to be rendered.
    await screen.findByRole('heading', { level: 5, name: product.title });

    const courseRun = order.target_courses[0].course_runs[0];
    let runElement = await screen.findByTestId(
      'dashboard-item__course-enrolling__run__' + courseRun.id,
    );

    // Make sure the courseRun is not enrolled.
    const enrollButton = getByRole(runElement, 'button', { name: 'Enroll' });
    expect(queryByText(runElement, 'Enrolled')).toBeNull();
    expect(
      fetchMock.called('https://joanie.endpoint/api/v1.0/enrollments/', { method: 'post' }),
    ).toBe(false);
    expect(fetchMock.calls('https://joanie.endpoint/api/v1.0/orders/').length).toBe(1);

    // Update the API mock to return the order with an enrollment.
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/orders/',
      { results: [orderWithEnrollment], next: null, previous: null, count: null },
      { overwriteRoutes: true },
    );

    (confirm as jest.Mock).mockReturnValue(true);

    expect(confirm).not.toHaveBeenCalled();
    fireEvent.click(enrollButton);

    expect(confirm).not.toHaveBeenCalled();

    await screen.findByTestId('dashboard-item__course-enrolling__loading');
    await waitFor(() =>
      expect(screen.queryByTestId('dashboard-item__course-enrolling__loading')).toBeNull(),
    );

    // Expect the enrollment to be created and orders invalided.
    await waitFor(() =>
      expect(
        fetchMock.called('https://joanie.endpoint/api/v1.0/enrollments/', { method: 'post' }),
      ).toBe(true),
    );
    expect(fetchMock.calls('https://joanie.endpoint/api/v1.0/orders/').length).toBe(2);

    await waitFor(async () => {
      // Expect the courseRun to be rendered as enrolled.
      runElement = await screen.findByTestId(
        'dashboard-item__course-enrolling__run__' + courseRun.id,
      );
      getByText(runElement, 'Enrolled');
    });

    expect(queryByRole(runElement, 'button', { name: 'Enroll' })).toBeNull();
  });

  it('renders a writable order with not enrolled target course and try to enroll it, but the API returns an error and it is shown', async () => {
    // Initial order without enrollment.
    const order: Order = OrderFactory({
      target_courses: TargetCourseFactory().many(1),
      target_enrollments: [],
    }).one();

    const { product } = mockCourseProductWithOrder(order);
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/orders/',
      { results: [order], next: null, previous: null, count: null },
      { overwriteRoutes: true },
    );

    fetchMock.post('https://joanie.endpoint/api/v1.0/enrollments/', {
      status: 500,
      body: 'Bad request',
    });

    render(WrapperWithDashboard(LearnerDashboardPaths.ORDER.replace(':orderId', order.id)));
    // Wait for the order to be rendered.
    await screen.findByRole('heading', { level: 5, name: product.title });

    await expectBreadcrumbsToEqualParts(['Back', 'My courses', product.title]);

    const courseRun = order.target_courses[0].course_runs[0];
    const runElement = await screen.findByTestId(
      'dashboard-item__course-enrolling__run__' + courseRun.id,
    );

    // Make sure the courseRun is not enrolled.
    const enrollButton = getByRole(runElement, 'button', { name: 'Enroll' });
    expect(queryByText(runElement, 'Enrolled')).toBeNull();
    fireEvent.click(enrollButton);

    await screen.findByTestId('dashboard-item__course-enrolling__loading');
    await waitFor(() =>
      expect(screen.queryByTestId('dashboard-item__course-enrolling__loading')).toBeNull(),
    );

    const element = await screen.findByTestId(
      'dashboard-item__course-enrolling__' + order.target_courses[0].code,
    );

    await expectBannerError(
      'An error occurred while creating the enrollment. Please retry later.',
      element,
    );
  });

  it('renders a writable order with enrolled target course and changes the enrollment', async () => {
    // Initial order with first course run enrolled.
    const order: Order = OrderFactory({ target_courses: TargetCourseFactory().many(1) }).one();
    const initialEnrolledCourseRun = order.target_courses[0].course_runs[0];
    order.target_enrollments = EnrollmentFactory({ course_run: initialEnrolledCourseRun }).many(1);

    // When the existing enrollment will be set as is_active: false.
    fetchMock.put(
      'https://joanie.endpoint/api/v1.0/enrollments/' + order.target_enrollments[0].id + '/',
      [],
    );

    const { product } = mockCourseProductWithOrder(order);
    fetchMock.post('https://joanie.endpoint/api/v1.0/enrollments/', []);
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/orders/',
      { results: [order], next: null, previous: null, count: null },
      { overwriteRoutes: true },
    );

    // The order with new enrollment that will be returned from the API when the orders will be
    // invalided after the click on the Enroll button.
    const newEnrolledCourseRun = order.target_courses[0].course_runs[1];
    const orderWithNewEnrollment = {
      ...order,
      target_enrollments: EnrollmentFactory({ course_run: newEnrolledCourseRun }).many(1),
    };

    render(WrapperWithDashboard(LearnerDashboardPaths.ORDER.replace(':orderId', order.id)));

    // Wait for the order to be rendered.
    await screen.findByRole('heading', { level: 5, name: product.title });

    let runElement = await screen.findByTestId(
      'dashboard-item__course-enrolling__run__' + newEnrolledCourseRun.id,
    );

    // Make sure the courseRun is not enrolled.
    const enrollButton = getByRole(runElement, 'button', { name: 'Enroll' });
    expect(queryByText(runElement, 'Enrolled')).toBeNull();
    expect(
      fetchMock.called('https://joanie.endpoint/api/v1.0/enrollments/', { method: 'post' }),
    ).toBe(false);
    expect(
      fetchMock.called(
        'https://joanie.endpoint/api/v1.0/enrollments/' + initialEnrolledCourseRun.id + '/',
        { method: 'put' },
      ),
    ).toBe(false);
    expect(fetchMock.calls('https://joanie.endpoint/api/v1.0/orders/').length).toBe(1);

    // Update the API mock to return the order with an enrollment.
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/orders/',
      { results: [orderWithNewEnrollment], next: null, previous: null, count: null },
      { overwriteRoutes: true },
    );
    (confirm as jest.Mock).mockReturnValue(true);
    expect(confirm).not.toHaveBeenCalled();
    fireEvent.click(enrollButton);
    expect(confirm).toHaveBeenCalledWith(
      'Are you sure you want to change your session? You will be unrolled from the other session!',
    );

    // Expect the enrollment to be created and orders invalided.
    await waitFor(() =>
      expect(
        fetchMock.called('https://joanie.endpoint/api/v1.0/enrollments/', { method: 'post' }),
      ).toBe(true),
    );

    // Expect the existing enrollment to be set as is_active: false.
    const calls = fetchMock.calls(
      'https://joanie.endpoint/api/v1.0/enrollments/' + order.target_enrollments[0].id + '/',
      { method: 'put' },
    );
    expect(calls.length).toBe(1);
    expect(JSON.parse(calls[0][1]!.body as any).is_active).toStrictEqual(false);

    expect(
      fetchMock.called(
        'https://joanie.endpoint/api/v1.0/enrollments/' + order.target_enrollments[0].id + '/',
        { method: 'put' },
      ),
    ).toBe(true);

    await waitFor(async () => {
      // Expect the new courseRun to be rendered as enrolled.
      runElement = await screen.findByTestId(
        'dashboard-item__course-enrolling__run__' + newEnrolledCourseRun.id,
      );
      getByText(runElement, 'Enrolled');
    });

    expect(queryByRole(runElement, 'button', { name: 'Enroll' })).toBeNull();
  });

  it('renders a writable order with enrolled target course and refuse the confirm message when enrolling', async () => {
    // Initial order without enrollment.
    const order: Order = OrderFactory({ target_courses: TargetCourseFactory().many(1) }).one();

    const initialEnrolledCourseRun = order.target_courses[0].course_runs[0];
    order.target_enrollments = [
      {
        ...EnrollmentFactory().one(),
        course_run: initialEnrolledCourseRun,
      },
    ];

    const { product } = mockCourseProductWithOrder(order);
    fetchMock.post('https://joanie.endpoint/api/v1.0/enrollments/', []);
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/orders/',
      { results: [order], next: null, previous: null, count: null },
      { overwriteRoutes: true },
    );

    const courseRun = order.target_courses[0].course_runs[0];
    const newEnrolledCourseRun = order.target_courses[0].course_runs[1];

    render(WrapperWithDashboard(LearnerDashboardPaths.ORDER.replace(':orderId', order.id)));

    // Wait for the order to be rendered.
    await screen.findByRole('heading', { level: 5, name: product.title });

    // Make sure the courseRun is enrolled.
    let runElement = await screen.findByTestId(
      'dashboard-item__course-enrolling__run__' + courseRun.id,
    );
    getByText(runElement, 'Enrolled');

    // Make sure the new courseRun is not enrolled.
    const newRunElement = await screen.findByTestId(
      'dashboard-item__course-enrolling__run__' + newEnrolledCourseRun.id,
    );
    const enrollButton = getByRole(newRunElement, 'button', { name: 'Enroll' });
    expect(queryByText(newRunElement, 'Enrolled')).toBeNull();

    expect(
      fetchMock.called('https://joanie.endpoint/api/v1.0/enrollments/', { method: 'post' }),
    ).toBe(false);
    expect(fetchMock.calls('https://joanie.endpoint/api/v1.0/orders/').length).toBe(1);

    (confirm as jest.Mock).mockReturnValue(false);

    expect(confirm).not.toHaveBeenCalled();
    fireEvent.click(enrollButton);
    expect(confirm).toHaveBeenCalledWith(
      'Are you sure you want to change your session? You will be unrolled from the other session!',
    );

    // I think this is dirty but I have no other ideas to "wait for the following expect to never happen".
    // The API calls and re-renders are asynchronous ( that's why we use waitFor is other tests where confirm is true),
    // so in any case, without a waitFor those `expect` will always pass. So, we wait a bit to be sure that
    // hypothetical asynchronous stuff are done.
    await sleep(100);

    // Make sure the courseRun is still enrolled.
    runElement = await screen.findByTestId(
      'dashboard-item__course-enrolling__run__' + courseRun.id,
    );
    getByText(runElement, 'Enrolled');

    // Expect the enrollment to not be created and orders not invalided.
    expect(
      fetchMock.called('https://joanie.endpoint/api/v1.0/enrollments/', { method: 'post' }),
    ).toBe(false);
    expect(fetchMock.calls('https://joanie.endpoint/api/v1.0/orders/').length).toBe(1);
  });

  it('renders a writable order with non-enrolled (is_active=false) target course and changes the enrollment', async () => {
    // Initial order with first course run enrolled.
    const order: Order = OrderFactory({ target_courses: TargetCourseFactory().many(1) }).one();

    const courseRun = order.target_courses[0].course_runs[0];
    const enrollment = {
      ...EnrollmentFactory().one(),
      course_run: courseRun,
      is_active: false,
    };
    order.target_enrollments = [enrollment];

    // When the existing enrollment will be set as is_active: true.
    fetchMock.put('https://joanie.endpoint/api/v1.0/enrollments/' + enrollment.id + '/', []);

    const { product } = mockCourseProductWithOrder(order);
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/orders/',
      { results: [order], next: null, previous: null, count: null },
      { overwriteRoutes: true },
    );

    // The order with new enrollment that will be returned from the API when the orders will be
    // invalided after the click on the Enroll button.
    const orderWithActiveEnrollment = {
      ...order,
      target_enrollments: [
        {
          ...enrollment,
          is_active: true,
        },
      ],
    };

    render(WrapperWithDashboard(LearnerDashboardPaths.ORDER.replace(':orderId', order.id)));

    // Wait for the order to be rendered.
    await screen.findByRole('heading', { level: 5, name: product.title });

    let runElement = await screen.findByTestId(
      'dashboard-item__course-enrolling__run__' + enrollment.course_run.id,
    );

    // Make sure the courseRun is not enrolled.
    const enrollButton = getByRole(runElement, 'button', { name: 'Enroll' });
    expect(queryByText(runElement, 'Enrolled')).toBeNull();
    expect(
      fetchMock.called('https://joanie.endpoint/api/v1.0/enrollments/' + enrollment.id + '/', {
        method: 'post',
      }),
    ).toBe(false);
    expect(fetchMock.calls('https://joanie.endpoint/api/v1.0/orders/').length).toBe(1);

    // Update the API mock to return the order with an enrollment.
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/orders/',
      { results: [orderWithActiveEnrollment], next: null, previous: null, count: null },
      { overwriteRoutes: true },
    );
    (confirm as jest.Mock).mockReturnValue(true);
    expect(confirm).not.toHaveBeenCalled();
    fireEvent.click(enrollButton);
    expect(confirm).not.toHaveBeenCalledWith();

    // Expect the existing enrollment to be updated with is_active: true.
    await waitFor(() => {
      const calls = fetchMock.calls(
        'https://joanie.endpoint/api/v1.0/enrollments/' + enrollment.id + '/',
        { method: 'put' },
      );
      expect(calls.length).toBe(1);
      expect(JSON.parse(calls[0][1]!.body as any).is_active).toStrictEqual(true);
    });

    await waitFor(async () => {
      // Expect the new courseRun to be rendered as enrolled.
      runElement = await screen.findByTestId(
        'dashboard-item__course-enrolling__run__' + courseRun.id,
      );
      getByText(runElement, 'Enrolled');
    });

    expect(queryByRole(runElement, 'button', { name: 'Enroll' })).toBeNull();
  });
  it('renders a writable order with not yet-opened course runs', async () => {
    const order: Order = OrderFactory({
      target_courses: TargetCourseFactory({
        course_runs: CourseRunFactory({
          enrollment_start: faker.date.past({ years: 0.5 }).toISOString(),
          enrollment_end: faker.date.past({ years: 0.25 }).toISOString(),
          state: {
            priority: Priority.FUTURE_NOT_YET_OPEN,
          },
        }).many(1),
      }).many(1),
    }).one();
    const { product } = mockCourseProductWithOrder(order);

    render(<DashboardItemOrder order={order} writable={true} showDetailsButton={false} />, {
      wrapper,
    });

    await screen.findByRole('heading', { level: 5, name: product.title });

    // Expect disclaimer text to appear.
    screen.getByText(
      'Enrollment will open on ' +
        new Intl.DateTimeFormat('en', DEFAULT_DATE_FORMAT).format(
          new Date(order.target_courses[0].course_runs[0].enrollment_start),
        ),
    );

    // Enroll button should be disabled.
    const button = await screen.findByRole('button', { name: 'Enroll' });
    expect(button).toBeDisabled();
  });

  it('renders a writable order with enrolled target course with finished enrollment phase and it is shown', async () => {
    const courseRun: CourseRun = CourseRunFactory({
      enrollment_end: faker.date.past({ years: 0.5 }).toISOString(),
      enrollment_start: faker.date.past({ years: 1 }).toISOString(),
      state: {
        priority: Priority.FUTURE_CLOSED,
      },
    }).one();
    const order: Order = OrderFactory({
      target_courses: TargetCourseFactory({ course_runs: [courseRun] }).many(1),
    }).one();

    // Make target course enrolled.
    order.target_enrollments = EnrollmentFactory({ course_run: courseRun }).many(1);

    const { product } = mockCourseProductWithOrder(order);

    render(<DashboardItemOrder order={order} writable={true} showDetailsButton={false} />, {
      wrapper,
    });

    await screen.findByRole('heading', { level: 5, name: product.title });
    await screen.findByText('Ref. ' + (order.course as CourseLight).code);
    await screen.findByText('On going');

    // The course run should be shown as enrolled even if is it past.
    const runElement = screen.getByTestId('dashboard-item__course-enrolling__run__' + courseRun.id);
    getByText(runElement, 'Enrolled');
    expect(queryByRole(runElement, 'button', { name: 'Enroll' })).toBeNull();
  });

  it('renders a writable order with non enrolled target course, course run with enrollment phase finished is not shown ', async () => {
    const courseRun: CourseRun = CourseRunFactory({
      enrollment_end: faker.date.past({ years: 0.5 }).toISOString(),
      enrollment_start: faker.date.past({ years: 1 }).toISOString(),
      state: {
        priority: Priority.FUTURE_CLOSED,
      },
    }).one();

    const order: Order = OrderFactory({
      target_courses: TargetCourseFactory({ course_runs: [courseRun] }).many(1),
      target_enrollments: [],
    }).one();

    const { product } = mockCourseProductWithOrder(order);

    render(<DashboardItemOrder order={order} writable={true} showDetailsButton={false} />, {
      wrapper,
    });

    await screen.findByRole('heading', { level: 5, name: product.title });
    await screen.findByText('Ref. ' + (order.course as CourseLight).code);
    await screen.findByText('On going');

    // The course run should not be shown.
    expect(
      screen.queryByTestId('dashboard-item__course-enrolling__run__' + courseRun.id),
    ).toBeNull();
  });
});
