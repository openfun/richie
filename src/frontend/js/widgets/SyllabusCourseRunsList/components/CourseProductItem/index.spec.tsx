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
import queryString from 'query-string';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import {
  CourseProductRelationFactory,
  EnrollmentFactory,
  OrderFactory,
  ProductFactory,
} from 'utils/test/factories/joanie';
import JoanieApiProvider from 'contexts/JoanieApiContext';
import { CourseRun, Enrollment, Order, OrderState } from 'types/Joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { Deferred } from 'utils/test/deferred';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import CourseProductItem from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
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
    // JoanieSessionProvider requests
    fetchMock.get('https://joanie.test/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.test/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.test/api/v1.0/orders/', []);
  });

  afterEach(() => {
    fetchMock.restore();
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
    const relation = CourseProductRelationFactory().one();
    const { product } = relation;
    const productDeferred = new Deferred();
    fetchMock.get(
      `https://joanie.test/api/v1.0/courses/00000/products/${product.id}/`,
      productDeferred.promise,
    );

    render(
      <Wrapper>
        <CourseProductItem courseCode="00000" productId={product.id} />
      </Wrapper>,
    );

    // - A loader should be displayed while product information are fetching
    screen.getByRole('status', { name: 'Loading product information...' });

    productDeferred.resolve(relation);

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

    // Languages and date range should not be displayed
    expect(screen.queryByTestId('product-widget__header-metadata-dates')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('product-widget__header-metadata-languages'),
    ).not.toBeInTheDocument();

    // - Render all target courses information
    relation.product.target_courses.forEach((course) => {
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
    const relation = CourseProductRelationFactory({
      product: ProductFactory({
        certificate_definition: undefined,
      }).one(),
    }).one();
    const { product } = relation;
    fetchMock.get(`https://joanie.test/api/v1.0/courses/00000/products/${product.id}/`, relation);

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

  it('adapts its layout if compact is set', async () => {
    const relation = CourseProductRelationFactory().one();
    const productDeferred = new Deferred();
    fetchMock.get(
      `https://joanie.test/api/v1.0/courses/00000/products/${relation.product.id}/`,
      productDeferred.promise,
    );

    const { container } = render(
      <Wrapper>
        <CourseProductItem courseCode="00000" productId={relation.product.id} compact />
      </Wrapper>,
    );

    // - A loader should be displayed while product information are fetching
    screen.getByRole('status', { name: 'Loading product information...' });

    productDeferred.resolve(relation);

    // In the header, we should display the product title, the product price
    // and product date range and languages
    await screen.findByRole('heading', { level: 3, name: relation.product.title });
    // the price shouldn't be a heading to prevent misdirection for screen reader users,
    // but we want to it to visually look like a h6

    const $price = screen.getByText(
      // the price formatter generates non-breaking spaces and getByText doesn't seem to handle that well, replace it
      // with a regular space. We replace NNBSP (\u202F) and NBSP (\u00a0) with a regular space
      priceFormatter(relation.product.price_currency, relation.product.price).replace(
        /(\u202F|\u00a0)/g,
        ' ',
      ),
    );
    expect($price.tagName).toBe('STRONG');
    expect($price.classList.contains('h6')).toBe(true);

    screen.getByTestId('product-widget__header-metadata-dates');
    screen.getByTestId('product-widget__header-metadata-languages');

    // Then the content block should only display the purchase button.
    const $productWidgetContent = container.querySelector('.product-widget__content');
    expect($productWidgetContent).not.toBeInTheDocument();

    // - Any target courses information should be displayed
    relation.product.target_courses.forEach((course) => {
      const $item = screen.queryByTestId(`course-item-${course.code}`);
      expect($item).not.toBeInTheDocument();
    });

    // - Any <CertificateItem /> should be displayed
    expect(screen.queryByTestId('CertificateItem')).not.toBeInTheDocument();

    // - Render a login button
    screen.getByRole('button', { name: `Login to purchase "${relation.product.title}"` });
    // - Does not render PurchaseButton cta
    expect(screen.queryByTestId('PurchaseButton__cta')).not.toBeInTheDocument();
  });

  it('adapts information when user purchased the product', async () => {
    const relation = CourseProductRelationFactory().one();
    const { product } = relation;
    const order = OrderFactory({
      product: product.id,
      course: '00000',
      target_courses: product.target_courses,
    }).one();

    fetchMock.get(`https://joanie.test/api/v1.0/courses/00000/products/${product.id}/`, relation);
    const orderQueryParameters = {
      product: order.product,
      course: order.course,
      state: [OrderState.PENDING, OrderState.VALIDATED, OrderState.SUBMITTED],
    };
    fetchMock.get(
      `https://joanie.test/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

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

  it('adapts information when user purchased the product even if compact is set', async () => {
    const relation = CourseProductRelationFactory().one();
    const order: Order = OrderFactory({
      product: relation.product.id,
      course: '00000',
      target_courses: relation.product.target_courses,
    }).one();

    fetchMock.get(
      `https://joanie.test/api/v1.0/courses/00000/products/${relation.product.id}/`,
      relation,
    );
    const orderQueryParameters = {
      product: order.product,
      course: order.course,
      state: [OrderState.PENDING, OrderState.VALIDATED, OrderState.SUBMITTED],
    };
    fetchMock.get(
      `https://joanie.test/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

    render(
      <Wrapper withSession>
        <CourseProductItem productId={relation.product.id} courseCode="00000" compact />
      </Wrapper>,
    );

    // Wait for product information to be fetched
    const loadingMessage = screen.getByRole('status', { name: 'Loading product information...' });
    await waitForElementToBeRemoved(loadingMessage);
    await screen.findByRole('heading', { level: 3, name: relation.product.title });

    // - In place of product price, a label should be displayed
    const $enrolledInfo = await screen.findByText('Purchased');
    expect($enrolledInfo.tagName).toBe('STRONG');
    expect($enrolledInfo.classList.contains('h6')).toBe(true);

    // - Product date range and languages should not be displayed anymore
    expect(screen.queryByTestId('product-widget__header-metadata-dates')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('product-widget__header-metadata-languages'),
    ).not.toBeInTheDocument();

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
    const relation = CourseProductRelationFactory().one();
    const { product } = relation;
    // - Create an order with an active enrollment
    const enrollment: Enrollment = EnrollmentFactory({
      course_run: product.target_courses[0]!.course_runs[0]! as CourseRun,
    }).one();
    const order: Order = OrderFactory({
      product: product.id,
      course: '00000',
      target_courses: product.target_courses,
      target_enrollments: [enrollment],
    }).one();

    fetchMock.get(`https://joanie.test/api/v1.0/courses/00000/products/${product.id}/`, relation);
    const orderQueryParameters = {
      product: order.product,
      course: order.course,
      state: [OrderState.PENDING, OrderState.VALIDATED, OrderState.SUBMITTED],
    };
    fetchMock.get(
      `https://joanie.test/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

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

  it('renders sale tunnel button if user already has a pending order', async () => {
    const relation = CourseProductRelationFactory().one();
    const { product } = relation;
    const order = OrderFactory({
      product: product.id,
      course: '00000',
      target_courses: product.target_courses,
      state: OrderState.PENDING,
    }).one();
    fetchMock.get(`https://joanie.test/api/v1.0/courses/00000/products/${product.id}/`, relation);
    const orderQueryParameters = {
      product: order.product,
      course: order.course,
      state: [OrderState.PENDING, OrderState.VALIDATED, OrderState.SUBMITTED],
    };
    fetchMock.get(
      `https://joanie.test/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

    render(
      <Wrapper withSession>
        <CourseProductItem productId={product.id} courseCode="00000" />
      </Wrapper>,
    );

    // Wait for product information to be fetched
    await screen.findByRole('status', { name: 'Loading product information...' });
    await screen.findByRole('heading', { level: 3, name: product.title });

    const $price = screen.getByText(
      // the price formatter generates non-breaking spaces and getByText doesn't seem to handle that well, replace it
      // with a regular space. We replace NNBSP (\u202F) and NBSP (\u00a0) with a regular space
      priceFormatter(product.price_currency, product.price).replace(/(\u202F|\u00a0)/g, ' '),
    );
    expect($price.tagName).toBe('STRONG');
    expect($price.classList.contains('h6')).toBe(true);

    // - Render all target courses information
    relation.product.target_courses.forEach((course) => {
      const $item = screen.getByTestId(`course-item-${course.code}`);
      // the course title shouldn't be a heading to prevent misdirection for screen reader users,
      // but we want to it to visually look like a h5
      const $courseTitle = getByText($item, course.title);
      expect($courseTitle.tagName).toBe('STRONG');
      expect($courseTitle.classList.contains('h5')).toBe(true);
      screen.getByTestId(`CourseRunList-${course.course_runs.map(({ id }) => id).join('-')}`);
    });

    screen.getByRole('button', { name: product.call_to_action });
  });

  it('renders sale tunnel button if user already has a canceled order', async () => {
    const relation = CourseProductRelationFactory().one();
    const { product } = relation;
    fetchMock.get(`https://joanie.test/api/v1.0/courses/00000/products/${product.id}/`, relation);
    const orderQueryParameters = {
      product: product.id,
      course: '00000',
      state: [OrderState.PENDING, OrderState.VALIDATED, OrderState.SUBMITTED],
    };
    fetchMock.get(
      `https://joanie.test/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [],
    );

    render(
      <Wrapper withSession>
        <CourseProductItem productId={product.id} courseCode="00000" />
      </Wrapper>,
    );

    // Wait for product information to be fetched
    await screen.findByRole('status', { name: 'Loading product information...' });
    await screen.findByRole('heading', { level: 3, name: product.title });

    const $price = screen.getByText(
      // the price formatter generates non-breaking spaces and getByText doesn't seem to handle that well, replace it
      // with a regular space. We replace NNBSP (\u202F) and NBSP (\u00a0) with a regular space
      priceFormatter(product.price_currency, product.price).replace(/(\u202F|\u00a0)/g, ' '),
    );
    expect($price.tagName).toBe('STRONG');
    expect($price.classList.contains('h6')).toBe(true);

    // - Render all target courses information
    relation.product.target_courses.forEach((course) => {
      const $item = screen.getByTestId(`course-item-${course.code}`);
      // the course title shouldn't be a heading to prevent misdirection for screen reader users,
      // but we want to it to visually look like a h5
      const $courseTitle = getByText($item, course.title);
      expect($courseTitle.tagName).toBe('STRONG');
      expect($courseTitle.classList.contains('h5')).toBe(true);
      screen.getByTestId(`CourseRunList-${course.course_runs.map(({ id }) => id).join('-')}`);
    });

    screen.getByRole('button', { name: product.call_to_action });
  });

  it('does not render sale tunnel button if user already has a submitted order', async () => {
    const relation = CourseProductRelationFactory().one();
    const { product } = relation;
    const order = OrderFactory({
      product: product.id,
      course: '00000',
      target_courses: product.target_courses,
      state: OrderState.SUBMITTED,
    }).one();
    fetchMock.get(`https://joanie.test/api/v1.0/courses/00000/products/${product.id}/`, relation);
    const orderQueryParameters = {
      product: order.product,
      course: order.course,
      state: [OrderState.PENDING, OrderState.VALIDATED, OrderState.SUBMITTED],
    };
    fetchMock.get(
      `https://joanie.test/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

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

  it('adapts layout when user has a pending order and compact prop is set', async () => {
    const relation = CourseProductRelationFactory().one();
    const order: Order = OrderFactory({
      product: relation.product.id,
      course: '00000',
      target_courses: relation.product.target_courses,
      state: OrderState.SUBMITTED,
    }).one();
    fetchMock.get(
      `https://joanie.test/api/v1.0/courses/00000/products/${relation.product.id}/`,
      relation,
    );
    const orderQueryParameters = {
      product: order.product,
      course: order.course,
      state: [OrderState.PENDING, OrderState.VALIDATED, OrderState.SUBMITTED],
    };
    fetchMock.get(
      `https://joanie.test/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

    render(
      <Wrapper withSession>
        <CourseProductItem productId={relation.product.id} courseCode="00000" compact={true} />
      </Wrapper>,
    );

    // Wait for product information to be fetched
    const loadingMessage = screen.getByRole('status', { name: 'Loading product information...' });
    await waitForElementToBeRemoved(loadingMessage);
    await screen.findByRole('heading', { level: 3, name: relation.product.title });

    // - In place of product price, a label should be displayed
    const $enrolledInfo = await screen.findByText('Pending');
    expect($enrolledInfo.tagName).toBe('STRONG');
    expect($enrolledInfo.classList.contains('h6')).toBe(true);

    // - Product date range and languages should be displayed
    screen.getByTestId('product-widget__header-metadata-dates');
    screen.getByTestId('product-widget__header-metadata-languages');

    // - Target courses should not be rendered
    await waitFor(() => {
      order.target_courses.forEach((course) => {
        const $item = screen.queryByTestId(`course-item-${course.code}`);
        expect($item).not.toBeInTheDocument();
      });
    });

    // - <CertificateItem /> should not be rendered
    expect(screen.queryByTestId('CertificateItem')).not.toBeInTheDocument();

    // - Does not Render PurchaseButton cta
    expect(screen.queryByTestId('PurchaseButton__cta')).toBeNull();
  });

  it('renders error message when product fetching has failed', async () => {
    const { product } = CourseProductRelationFactory().one();

    fetchMock.get(`https://joanie.test/api/v1.0/courses/00000/products/${product.id}/`, 404, {});

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
