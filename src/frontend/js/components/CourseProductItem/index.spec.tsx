import { getByText, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import type { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClientProvider } from 'react-query';
import {
  CertificateProductFactory,
  ContextFactory as mockContextFactory,
  JoanieEnrollmentFactory,
  OrderLiteFactory,
  ProductFactory,
} from 'utils/test/factories';
import { CourseCodeProvider } from 'data/CourseCodeProvider';
import JoanieApiProvider from 'data/JoanieApiProvider';
import { CourseRun, Enrollment, OrderLite, Product } from 'types/Joanie';
import createQueryClient from 'utils/react-query/createQueryClient';
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
  EnrollableCourseRunList: ({
    courseRuns,
    order,
  }: {
    courseRuns: CourseRun[];
    order: OrderLite;
  }) => (
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
    OrderLiteFactory.afterGenerate((o: OrderLite) => o);
  });

  const Wrapper = ({ code, children }: PropsWithChildren<{ code: string }>) => (
    <IntlProvider locale="en">
      <CourseCodeProvider code={code}>
        <JoanieApiProvider>
          <QueryClientProvider client={createQueryClient()}>{children}</QueryClientProvider>
        </JoanieApiProvider>
      </CourseCodeProvider>
    </IntlProvider>
  );

  it('renders product information', () => {
    const product: Product = ProductFactory.generate();

    render(
      <Wrapper code="00000">
        <CourseProductItem product={product} />
      </Wrapper>,
    );

    screen.getByRole('heading', { level: 3, name: product.title });
    // the price shouldn't be a heading to prevent misdirection for screen reader users
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
      // the course title shouldn't be a heading to prevent misdirection for screen reader users
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

  it('does not render <CertificateItem /> if product do not have a certificate', () => {
    const product: Product = ProductFactory.afterGenerate(
      ({ certificate, ...p }: Product) => p,
    ).generate();

    render(
      <Wrapper code="00000">
        <CourseProductItem product={product} />
      </Wrapper>,
    );

    // - Does not render <CertificateItem />
    expect(screen.queryByTestId('CertificateItem')).toBeNull();
  });

  it('adapts information when user purchased the product', () => {
    const product: Product = ProductFactory.generate();
    const order: OrderLite = OrderLiteFactory.generate();

    render(
      <Wrapper code="00000">
        <CourseProductItem product={product} order={order} />
      </Wrapper>,
    );

    screen.getByRole('heading', { level: 3, name: product.title });
    // - In place of product price, a label should be displayed
    const $enrolledInfo = screen.getByText('Enrolled');
    expect($enrolledInfo.tagName).toBe('STRONG');
    expect($enrolledInfo.classList.contains('h6')).toBe(true);

    // - Render all target courses information with EnrollableCourseRunList component
    product.target_courses.forEach((course) => {
      const $item = screen.getByTestId(`course-item-${course.code}`);
      // the course title shouldn't be a heading to prevent misdirection for screen reader users
      // but we want to it to visually look like a h5
      const $courseTitle = getByText($item, course.title);
      expect($courseTitle.tagName).toBe('STRONG');
      expect($courseTitle.classList.contains('h5')).toBe(true);
      screen.getByTestId(
        `EnrollableCourseRunList-${course.course_runs.map(({ id }) => id).join('-')}-${order.id}`,
      );
    });

    // - Render <CertificateItem />
    screen.getByTestId('CertificateItem');

    // - Does not Render <SaleTunnel />
    expect(screen.queryByTestId('SaleTunnel')).toBeNull();
  });

  it('renders enrollment information when user is enrolled to a course run', () => {
    const product: Product = CertificateProductFactory.generate();
    // - Create an order with an active enrollment
    const enrollment: Enrollment = JoanieEnrollmentFactory.afterGenerate(
      ({ state, ...e }: Enrollment): Enrollment => ({
        ...e,
        course_run: product.target_courses[0]!.course_runs[0]! as CourseRun,
        state,
      }),
    ).generate();
    const order: OrderLite = OrderLiteFactory.afterGenerate((o: OrderLite) => ({
      ...o,
      product: product.id,
      enrollments: [enrollment],
    })).generate();

    render(
      <Wrapper code="00000">
        <CourseProductItem product={product} order={order} />
      </Wrapper>,
    );

    screen.getByRole('heading', { level: 3, name: product.title });
    // - In place of product price, a label should be displayed
    const $enrolledInfo = screen.getByText('Enrolled');
    expect($enrolledInfo.tagName).toBe('STRONG');
    expect($enrolledInfo.classList.contains('h6')).toBe(true);

    const [targetCourse, ...targetCourses] = product.target_courses;
    // - The first target course should display the EnrolledCourseRun component
    const $courseTitle = screen.getByText(targetCourse.title);
    expect($courseTitle.tagName).toBe('STRONG');
    expect($courseTitle.classList.contains('h5')).toBe(true);
    screen.getByTestId(`EnrolledCourseRun-${enrollment.id}`);

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
