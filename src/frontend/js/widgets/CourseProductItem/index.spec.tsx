import {
  getByText,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import fetchMock from 'fetch-mock';
import type { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import {
  CertificateProductFactory,
  EnrollmentFactory,
  OrderFactory,
  ProductFactory,
} from 'utils/test/factories/joanie';
import JoanieApiProvider from 'contexts/JoanieApiContext';
import { CourseRun, Enrollment, Order, OrderState, Product } from 'types/Joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { Deferred } from 'utils/test/deferred';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import CourseProductItem from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).generate(),
}));

jest.mock('./components/CourseProductCertificateItem', () => ({
  __esModule: true,
  default: () => <div data-testid="CertificateItem" />,
}));

jest.mock('./components/CourseProductCourseRuns', () => ({
  CourseRunList: ({ courseRuns }: { courseRuns: CourseRun[] }) => (
    <div data-testid={`CourseRunList-${courseRuns.map(({ id }) => id).join('-')}`} />
  ),
  EnrollableCourseRunList: ({ courseRuns, order }: { courseRuns: CourseRun[]; order: Order }) => (
    <div
      data-testid={`EnrollableCourseRunList-${courseRuns.map(({ id }) => id).join('-')}-${
        order.id
      }`}
    />
  ),
  EnrolledCourseRun: ({ enrollment }: { enrollment: Enrollment }) => (
    <div data-testid={`EnrolledCourseRun-${enrollment.id}`} />
  ),
}));

describe('CourseProductItem', () => {
  const priceFormatter = (currency: string, price: number) =>
    new Intl.NumberFormat('en', {
      currency,
      style: 'currency',
    }).format(price);

  beforeAll(() => {
    // As dialog is rendered through a Portal, we have to add the DOM element in which the dialog will be rendered.
    const modalExclude = document.createElement('div');
    modalExclude.setAttribute('id', 'modal-exclude');
    document.body.appendChild(modalExclude);
  });

  beforeEach(() => {
    fetchMock.get('https://joanie.test/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.test/api/v1.0/credit-cards/', []);
  });

  afterEach(() => {
    fetchMock.restore();
    EnrollmentFactory.afterGenerate((e: Enrollment) => e);
    ProductFactory.afterGenerate((p: Product) => p);
    OrderFactory.afterGenerate((o: Order) => o);
  });

  const Wrapper = ({ withSession, children }: PropsWithChildren<{ withSession?: boolean }>) => (
    <IntlProvider locale="en">
      <JoanieApiProvider>
        <QueryClientProvider client={createTestQueryClient({ user: withSession || null })}>
          <JoanieSessionProvider>{children}</JoanieSessionProvider>
        </QueryClientProvider>
      </JoanieApiProvider>
    </IntlProvider>
  );

  it('renders product information', async () => {
    const product: Product = ProductFactory.generate();
    const productDeferred = new Deferred();
    fetchMock.get(
      `https://joanie.test/api/v1.0/products/${product.id}/?course=00000`,
      productDeferred.promise,
    );

    render(
      <Wrapper>
        <CourseProductItem courseCode="00000" productId={product.id} />
      </Wrapper>,
    );

    // - A loader should be displayed while product information are fetching
    screen.getByRole('status', { name: 'Loading product information...' });

    productDeferred.resolve(product);

    await screen.findByRole('heading', { level: 3, name: product.title });
    // the price shouldn't be a heading to prevent misdirection for screen reader users,
    // but we want to it to visually look like a h6

    const $price = screen.getByText(
      // the price formatter generates non-breaking spaces and getByText doesn't seem to handle that well, replace it
      // with a regular space. We replace NNBSP (\u202F) and NBSP (\u00a0) with a regular space
      priceFormatter(product.price_currency, product.price).replace(/(\u202F|\u00a0)/g, ' '),
    );
    expect($price.tagName).toBe('STRONG');
    expect($price.classList.contains('h6')).toBe(true);

    // - Render all target courses information
    product.target_courses.forEach((course) => {
      const $item = screen.getByTestId(`course-item-${course.code}`);
      // the course title shouldn't be a heading to prevent misdirection for screen reader users,
      // but we want to it to visually look like a h5
      const $courseTitle = getByText($item, course.title);
      expect($courseTitle.tagName).toBe('STRONG');
      expect($courseTitle.classList.contains('h5')).toBe(true);
      screen.getByTestId(`CourseRunList-${course.course_runs.map(({ id }) => id).join('-')}`);
    });

    // - Render <CertificateItem />
    screen.getByTestId('CertificateItem');

    // - Render a login button
    screen.getByRole('button', { name: `Login to purchase "${product.title}"` });
    // - Does not render PurchaseButton cta
    expect(screen.queryByTestId('PurchaseButton__cta')).toBeNull();
  });

  it('does not render <CertificateItem /> if product do not have a certificate', async () => {
    const product: Product = ProductFactory.afterGenerate(
      ({ certificate_definition, ...p }: Product) => p,
    ).generate();

    fetchMock.get(`https://joanie.test/api/v1.0/products/${product.id}/?course=00000`, product);

    render(
      <Wrapper>
        <CourseProductItem productId={product.id} courseCode="00000" />
      </Wrapper>,
    );

    // Wait for product information to be fetched
    await screen.findByRole('heading', { level: 3, name: product.title });

    // - Does not render <CertificateItem />
    expect(screen.queryByTestId('CertificateItem')).toBeNull();
  });

  it('adapts information when user purchased the product', async () => {
    const product: Product = ProductFactory.generate();
    const order: Order = OrderFactory.afterGenerate((o: Order) => ({
      ...o,
      product: product.id,
      course: '00000',
      target_courses: product.target_courses,
    })).generate();

    fetchMock.get(`https://joanie.test/api/v1.0/products/${product.id}/?course=00000`, product);
    fetchMock.get(`https://joanie.test/api/v1.0/orders/`, [order]);

    render(
      <Wrapper withSession>
        <CourseProductItem productId={product.id} courseCode="00000" />
      </Wrapper>,
    );

    // Wait for product information to be fetched
    const loadingMessage = screen.getByRole('status', { name: 'Loading product information...' });
    await waitForElementToBeRemoved(loadingMessage);
    await screen.findByRole('heading', { level: 3, name: product.title });

    // - In place of product price, a label should be displayed
    const $enrolledInfo = await screen.findByText('Purchased');
    expect($enrolledInfo.tagName).toBe('STRONG');
    expect($enrolledInfo.classList.contains('h6')).toBe(true);

    // - Render all order's target courses information with EnrollableCourseRunList component
    await waitFor(() => {
      order.target_courses.forEach((course) => {
        const $item = screen.getByTestId(`course-item-${course.code}`);
        // the course title shouldn't be a heading to prevent misdirection for screen reader users,
        // but we want to it to visually look like a h5
        const $courseTitle = getByText($item, course.title);
        expect($courseTitle.tagName).toBe('STRONG');
        expect($courseTitle.classList.contains('h5')).toBe(true);
        screen.getByTestId(
          `EnrollableCourseRunList-${course.course_runs.map(({ id }) => id).join('-')}-${order.id}`,
        );
      });
    });

    // - Render <CertificateItem />
    screen.getByTestId('CertificateItem');

    // - Does not Render PurchaseButton cta
    expect(screen.queryByTestId('PurchaseButton__cta')).toBeNull();
  });

  it('renders enrollment information when user is enrolled to a course run', async () => {
    const product: Product = CertificateProductFactory.generate();
    // - Create an order with an active enrollment
    const enrollment: Enrollment = EnrollmentFactory.afterGenerate(
      ({ state, ...e }: Enrollment): Enrollment => ({
        ...e,
        course_run: product.target_courses[0]!.course_runs[0]! as CourseRun,
        state,
      }),
    ).generate();
    const order: Order = OrderFactory.afterGenerate((o: Order) => ({
      ...o,
      product: product.id,
      course: '00000',
      target_courses: product.target_courses,
      enrollments: [enrollment],
    })).generate();

    fetchMock.get(`https://joanie.test/api/v1.0/products/${product.id}/?course=00000`, product);
    fetchMock.get(`https://joanie.test/api/v1.0/orders/`, [order]);

    render(
      <Wrapper withSession>
        <CourseProductItem productId={product.id} courseCode="00000" />
      </Wrapper>,
    );

    // Wait for product information to be fetched
    const loadingMessage = screen.getByRole('status', { name: 'Loading product information...' });
    await waitForElementToBeRemoved(loadingMessage);
    await screen.findByRole('heading', { level: 3, name: product.title });

    // - In place of product price, a label should be displayed
    const $enrolledInfo: HTMLElement = await screen.findByText('Purchased');
    expect($enrolledInfo!.tagName).toBe('STRONG');
    expect($enrolledInfo!.classList.contains('h6')).toBe(true);

    const [targetCourse, ...targetCourses] = product.target_courses;
    // - The first target course should display the EnrolledCourseRun component
    const $courseTitle = screen.getByText(targetCourse.title);
    expect($courseTitle.tagName).toBe('STRONG');
    expect($courseTitle.classList.contains('h5')).toBe(true);
    await waitFor(() => {
      screen.getByTestId(`EnrolledCourseRun-${enrollment.id}`);
    });

    // - Other target courses should display EnrollableCourseRunList component
    targetCourses.forEach((course) => {
      const $item = screen.getByTestId(`course-item-${course.code}`);
      const $itemTitle = getByText($item, course.title);
      expect($itemTitle.tagName).toBe('STRONG');
      expect($itemTitle.classList.contains('h5')).toBe(true);

      screen.getByTestId(
        `EnrollableCourseRunList-${course.course_runs.map(({ id }) => id).join('-')}-${order.id}`,
      );
    });
  });

  it('does not render sale tunnel button if user already has a pending order', async () => {
    const product: Product = ProductFactory.generate();
    const order: Order = OrderFactory.afterGenerate((o: Order) => ({
      ...o,
      product: product.id,
      course: '00000',
      target_courses: product.target_courses,
      state: OrderState.PENDING,
    })).generate();

    fetchMock.get(`https://joanie.test/api/v1.0/products/${product.id}/?course=00000`, product);
    fetchMock.get(`https://joanie.test/api/v1.0/orders/`, [order]);

    render(
      <Wrapper withSession>
        <CourseProductItem productId={product.id} courseCode="00000" />
      </Wrapper>,
    );

    // Wait for product information to be fetched
    const loadingMessage = screen.getByRole('status', { name: 'Loading product information...' });
    await waitForElementToBeRemoved(loadingMessage);
    await screen.findByRole('heading', { level: 3, name: product.title });

    // - In place of product price, a label "Pending" should be displayed
    const $enrolledInfo = await screen.findByText('Pending');
    expect($enrolledInfo.tagName).toBe('STRONG');
    expect($enrolledInfo.classList.contains('h6')).toBe(true);

    // - As order is pending, the user should not be able to enroll to course runs.
    await waitFor(() => {
      order.target_courses.forEach((course) => {
        const $item = screen.getByTestId(`course-item-${course.code}`);
        // the course title shouldn't be a heading to prevent misdirection for screen reader users,
        // but we want to it to visually look like a h5
        const $courseTitle = getByText($item, course.title);
        expect($courseTitle.tagName).toBe('STRONG');
        expect($courseTitle.classList.contains('h5')).toBe(true);
        screen.getByTestId(`CourseRunList-${course.course_runs.map(({ id }) => id).join('-')}`);
      });
    });

    // - Render <CertificateItem />
    screen.getByTestId('CertificateItem');

    // - Does not Render PurchaseButton cta
    expect(screen.queryByTestId('PurchaseButton__cta')).toBeNull();
  });

  it('renders error message when product fetching has failed', async () => {
    const product: Product = ProductFactory.generate();

    fetchMock.get(`https://joanie.test/api/v1.0/products/${product.id}/?course=00000`, 404, {});

    render(
      <Wrapper>
        <CourseProductItem productId={product.id} courseCode="00000" />
      </Wrapper>,
    );

    // Wait for product information to be fetched
    const loadingMessage = screen.getByRole('status', { name: 'Loading product information...' });
    await waitForElementToBeRemoved(loadingMessage);

    // - As product fetching has failed, an error message should be displayed
    await screen.findByText('An error occurred while fetching product. Please retry later.');
  });
});
