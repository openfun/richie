import { getByText, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import type { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import faker from 'faker';
import {
  CertificateProductFactory,
  ContextFactory as mockContextFactory,
  JoanieEnrollmentFactory,
  OrderFactory,
  ProductFactory,
} from 'utils/test/factories';
import JoanieApiProvider from 'data/JoanieApiProvider';
import { CourseRun, Enrollment, Order, Product } from 'types/Joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { Deferred } from 'utils/test/deferred';
import CourseProductItem from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).generate(),
}));

jest.mock('components/SaleTunnel', () => ({
  __esModule: true,
  default: () => <div data-testid="SaleTunnel" />,
}));

jest.mock('components/CourseProductCertificateItem', () => ({
  __esModule: true,
  default: () => <div data-testid="CertificateItem" />,
}));

jest.mock('components/CourseProductCourseRuns', () => ({
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

  afterEach(() => {
    fetchMock.restore();
    JoanieEnrollmentFactory.afterGenerate((e: Enrollment) => e);
    ProductFactory.afterGenerate((p: Product) => p);
    OrderFactory.afterGenerate((o: Order) => o);
  });

  const Wrapper = ({ children }: PropsWithChildren<{}>) => (
    <IntlProvider locale="en">
      <JoanieApiProvider>
        <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
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
      priceFormatter(product.price_currency, product.price).replace(/\u00a0/g, ' '),
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

    // - Render <SaleTunnel />
    screen.getByTestId('SaleTunnel');
  });

  it('does not render <CertificateItem /> if product do not have a certificate', async () => {
    const product: Product = ProductFactory.afterGenerate(
      ({ certificate, ...p }: Product) => p,
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
    const orderId = faker.datatype.uuid();
    const product: Product = ProductFactory.afterGenerate((p: Product) => ({
      ...p,
      orders: [orderId],
    })).generate();
    const order: Order = OrderFactory.afterGenerate((o: Order) => ({
      ...o,
      target_courses: product.target_courses,
      id: orderId,
    })).generate();

    fetchMock.get(`https://joanie.test/api/v1.0/products/${product.id}/?course=00000`, product);
    fetchMock.get(`https://joanie.test/api/v1.0/orders/`, [order]);

    render(
      <Wrapper>
        <CourseProductItem productId={product.id} courseCode="00000" />
      </Wrapper>,
    );

    // Wait for product information to be fetched
    await screen.findByRole('heading', { level: 3, name: product.title });

    // - In place of product price, a label should be displayed
    const $enrolledInfo = screen.getByText('Enrolled');
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
          `EnrollableCourseRunList-${course.course_runs.map(({ id }) => id).join('-')}-${orderId}`,
        );
      });
    });

    // - Render <CertificateItem />
    screen.getByTestId('CertificateItem');

    // - Does not Render <SaleTunnel />
    expect(screen.queryByTestId('SaleTunnel')).toBeNull();
  });

  it('renders enrollment information when user is enrolled to a course run', async () => {
    const orderId = faker.datatype.uuid();
    const product: Product = CertificateProductFactory.afterGenerate((p: Product) => ({
      ...p,
      orders: [orderId],
    })).generate();
    // - Create an order with an active enrollment
    const enrollment: Enrollment = JoanieEnrollmentFactory.afterGenerate(
      ({ state, ...e }: Enrollment): Enrollment => ({
        ...e,
        course_run: product.target_courses[0]!.course_runs[0]! as CourseRun,
        state,
      }),
    ).generate();
    const order: Order = OrderFactory.afterGenerate((o: Order) => ({
      ...o,
      id: orderId,
      product: product.id,
      target_courses: product.target_courses,
      enrollments: [enrollment],
    })).generate();

    fetchMock.get(`https://joanie.test/api/v1.0/products/${product.id}/?course=00000`, product);
    fetchMock.get(`https://joanie.test/api/v1.0/orders/`, [order]);

    render(
      <Wrapper>
        <CourseProductItem productId={product.id} courseCode="00000" />
      </Wrapper>,
    );

    // Wait for product information to be fetched
    await screen.findByRole('heading', { level: 3, name: product.title });

    // - In place of product price, a label should be displayed
    const $enrolledInfo: HTMLElement = await screen.findByText('Enrolled');
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
});
