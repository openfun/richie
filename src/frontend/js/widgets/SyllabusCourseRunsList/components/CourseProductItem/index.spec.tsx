import { getByText, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import queryString from 'query-string';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import {
  CourseLightFactory,
  CourseProductRelationFactory,
  EnrollmentFactory,
  CredentialOrderFactory,
  ProductFactory,
  OrderGroupFullFactory,
  OrderGroupFactory,
} from 'utils/test/factories/joanie';
import {
  CourseRun,
  Enrollment,
  CredentialOrder,
  OrderState,
  ACTIVE_ORDER_STATES,
} from 'types/Joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { Deferred } from 'utils/test/deferred';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { expectNoSpinner, expectSpinner } from 'utils/test/expectSpinner';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import CourseProductItem from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
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
  EnrollableCourseRunList: ({
    courseRuns,
    order,
  }: {
    courseRuns: CourseRun[];
    order: CredentialOrder;
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
  setupJoanieSession();

  const priceFormatter = (currency: string, price: number) =>
    new Intl.NumberFormat('en', {
      currency,
      style: 'currency',
    }).format(price);

  it('should display a loader until product is loaded', async () => {
    const relation = CourseProductRelationFactory().one();
    const { product } = relation;
    const productDeferred = new Deferred();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      productDeferred.promise,
    );

    render(
      <CourseProductItem
        course={CourseLightFactory({ code: '00000' }).one()}
        productId={product.id}
      />,
      { queryOptions: { client: createTestQueryClient({ user: null }) } },
    );

    // - A loader should be displayed while product information are fetching
    await expectSpinner('Loading product information...');
    productDeferred.resolve(relation);
    await expectNoSpinner('Loading product information...');
  });

  it('renders product information for anonymous user', async () => {
    const relation = CourseProductRelationFactory().one();
    const { product } = relation;
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      relation,
    );

    render(
      <CourseProductItem
        course={CourseLightFactory({ code: '00000' }).one()}
        productId={product.id}
      />,
      { queryOptions: { client: createTestQueryClient({ user: null }) } },
    );

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
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      relation,
    );

    render(
      <CourseProductItem
        productId={product.id}
        course={CourseLightFactory({ code: '00000' }).one()}
      />,
      { queryOptions: { client: createTestQueryClient({ user: null }) } },
    );

    // Wait for product information to be fetched
    await screen.findByRole('heading', { level: 3, name: product.title });

    // - Does not render <CertificateItem />
    expect(screen.queryByTestId('CertificateItem')).toBeNull();
  });

  it('renders product informations in compact mode', async () => {
    const relation = CourseProductRelationFactory().one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${relation.product.id}/`,
      relation,
    );

    const { container } = render(
      <CourseProductItem
        course={CourseLightFactory({ code: '00000' }).one()}
        productId={relation.product.id}
        compact
      />,
      { queryOptions: { client: createTestQueryClient({ user: null }) } },
    );

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

  it('renders product informations for a purchased product', async () => {
    const relation = CourseProductRelationFactory().one();
    const { product } = relation;
    const order = CredentialOrderFactory({
      product_id: product.id,
      course: CourseLightFactory({ code: '00000' }).one(),
      target_courses: product.target_courses,
    }).one();

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      relation,
    );
    const orderQueryParameters = {
      product_id: order.product_id,
      course_code: order.course.code,
      state: ACTIVE_ORDER_STATES,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

    render(
      <CourseProductItem
        productId={product.id}
        course={CourseLightFactory({ code: '00000' }).one()}
      />,
    );

    // Wait for product information to be fetched
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

  it('renders product informations for a purchased product in compact mode', async () => {
    const relation = CourseProductRelationFactory().one();
    const order: CredentialOrder = CredentialOrderFactory({
      product_id: relation.product.id,
      course: CourseLightFactory({ code: '00000' }).one(),
      target_courses: relation.product.target_courses,
    }).one();

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${relation.product.id}/`,
      relation,
    );
    const orderQueryParameters = {
      product_id: order.product_id,
      course_code: order.course?.code,
      state: ACTIVE_ORDER_STATES,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

    render(
      <CourseProductItem
        productId={relation.product.id}
        course={CourseLightFactory({ code: '00000' }).one()}
        compact
      />,
    );

    // Wait for product information to be fetched
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
    const order: CredentialOrder = CredentialOrderFactory({
      product_id: product.id,
      course: CourseLightFactory({ code: '00000' }).one(),
      target_courses: product.target_courses,
      target_enrollments: [enrollment],
    }).one();

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      relation,
    );
    const orderQueryParameters = {
      product_id: order.product_id,
      course_code: order.course?.code,
      state: ACTIVE_ORDER_STATES,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

    render(
      <CourseProductItem
        productId={product.id}
        course={CourseLightFactory({ code: '00000' }).one()}
      />,
    );

    // Wait for product information to be fetched
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
    const order = CredentialOrderFactory({
      product_id: product.id,
      course: CourseLightFactory({ code: '00000' }).one(),
      target_courses: product.target_courses,
      state: OrderState.PENDING,
    }).one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      relation,
    );
    const orderQueryParameters = {
      product_id: order.product_id,
      course_code: order.course?.code,
      state: ACTIVE_ORDER_STATES,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

    render(
      <CourseProductItem
        productId={product.id}
        course={CourseLightFactory({ code: '00000' }).one()}
      />,
    );

    // Wait for product information to be fetched
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
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      relation,
    );
    const orderQueryParameters = {
      product_id: product.id,
      course_code: '00000',
      state: ACTIVE_ORDER_STATES,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [],
    );

    render(
      <CourseProductItem
        productId={product.id}
        course={CourseLightFactory({ code: '00000' }).one()}
      />,
    );

    // Wait for product information to be fetched
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
    const order = CredentialOrderFactory({
      product_id: product.id,
      course: CourseLightFactory({ code: '00000' }).one(),
      target_courses: product.target_courses,
      state: OrderState.SUBMITTED,
    }).one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      relation,
    );
    const orderQueryParameters = {
      product_id: order.product_id,
      course_code: order.course?.code,
      state: ACTIVE_ORDER_STATES,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

    render(
      <CourseProductItem
        productId={product.id}
        course={CourseLightFactory({ code: '00000' }).one()}
      />,
    );

    // Wait for product information to be fetched
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

  it.each([
    {
      orderState: OrderState.PENDING,
    },
    {
      orderState: OrderState.SUBMITTED,
    },
    {
      orderState: OrderState.DRAFT,
    },
  ])(
    "should not render sign button and banner for order's state $orderState",
    async ({ orderState }) => {
      const relation = CourseProductRelationFactory().one();
      const { product } = relation;
      const order = CredentialOrderFactory({
        product_id: product.id,
        target_courses: product.target_courses,
        course: CourseLightFactory({ code: '00000' }).one(),
        state: orderState,
      }).one();
      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
        relation,
      );
      const orderQueryParameters = {
        product_id: order.product_id,
        course_code: order.course.code,
        state: ACTIVE_ORDER_STATES,
      };

      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
        [order],
      );

      render(
        <CourseProductItem
          productId={product.id}
          course={CourseLightFactory({ code: '00000' }).one()}
        />,
      );

      // Wait for product information to be fetched
      expect(
        await screen.findByRole('heading', { level: 3, name: product.title }),
      ).toBeInTheDocument();

      // - A banner should be displayed.
      expect(
        screen.queryByText(
          'You need to sign your training contract before enrolling to course runs',
        ),
      ).not.toBeInTheDocument();

      expect(
        screen.queryByRole('link', { name: 'Sign your training contract' }),
      ).not.toBeInTheDocument();
    },
  );

  it('renders a button and a banner if the contract needs to be signed', async () => {
    const relation = CourseProductRelationFactory().one();
    const { product } = relation;
    const order = CredentialOrderFactory({
      product_id: product.id,
      target_courses: product.target_courses,
      course: CourseLightFactory({ code: '00000' }).one(),
      state: OrderState.VALIDATED,
    }).one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      relation,
    );
    const orderQueryParameters = {
      product_id: order.product_id,
      course_code: order.course.code,
      state: ACTIVE_ORDER_STATES,
    };

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

    render(
      <CourseProductItem
        productId={product.id}
        course={CourseLightFactory({ code: '00000' }).one()}
      />,
    );

    // Wait for product information to be fetched
    await screen.findByRole('heading', { level: 3, name: product.title });

    // - A banner should be displayed.
    screen.getByText('You need to sign your training contract before enrolling to course runs');
    screen.getByRole('link', { name: 'Sign your training contract' });
  });

  it('adapts layout when user has a pending order and compact prop is set', async () => {
    const relation = CourseProductRelationFactory().one();
    const order: CredentialOrder = CredentialOrderFactory({
      product_id: relation.product.id,
      course: CourseLightFactory({ code: '00000' }).one(),
      target_courses: relation.product.target_courses,
      state: OrderState.SUBMITTED,
    }).one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${relation.product.id}/`,
      relation,
    );
    const orderQueryParameters = {
      product_id: order.product_id,
      course_code: order.course?.code,
      state: ACTIVE_ORDER_STATES,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

    render(
      <CourseProductItem
        productId={relation.product.id}
        course={CourseLightFactory({ code: '00000' }).one()}
        compact={true}
      />,
    );

    // Wait for product information to be fetched
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

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      HttpStatusCode.NOT_FOUND,
      {},
    );

    render(
      <CourseProductItem
        productId={product.id}
        course={CourseLightFactory({ code: '00000' }).one()}
      />,
      { queryOptions: { client: createTestQueryClient({ user: null }) } },
    );

    // - As product fetching has failed, an error message should be displayed
    await screen.findByText('An error occurred while fetching product. Please retry later.');
  });

  it('renders a warning message that tells that no seats are left', async () => {
    const relation = CourseProductRelationFactory({
      order_groups: [OrderGroupFullFactory().one()],
    }).one();
    const { product } = relation;
    const order = CredentialOrderFactory({
      product_id: product.id,
      course: CourseLightFactory({ code: '00000' }).one(),
      target_courses: product.target_courses,
      state: OrderState.PENDING,
    }).one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      relation,
    );
    const orderQueryParameters = {
      product_id: order.product_id,
      course_code: order.course?.code,
      state: ACTIVE_ORDER_STATES,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

    render(
      <CourseProductItem
        productId={product.id}
        course={CourseLightFactory({ code: '00000' }).one()}
      />,
    );

    // wait for component to be fully loaded
    await screen.findByRole('heading', { level: 3, name: product.title });

    expect(screen.queryByRole('button', { name: product.call_to_action })).not.toBeInTheDocument();
    screen.getByText('Sorry, no seats available for now');
  });

  it('renders one payment button when one of two order groups is full', async () => {
    const relation = CourseProductRelationFactory({
      order_groups: [OrderGroupFullFactory().one(), OrderGroupFactory().one()],
    }).one();
    const { product } = relation;
    const order = CredentialOrderFactory({
      product_id: product.id,
      course: CourseLightFactory({ code: '00000' }).one(),
      target_courses: product.target_courses,
      state: OrderState.PENDING,
    }).one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      relation,
    );
    const orderQueryParameters = {
      product_id: order.product_id,
      course_code: order.course?.code,
      state: ACTIVE_ORDER_STATES,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

    render(
      <CourseProductItem
        productId={product.id}
        course={CourseLightFactory({ code: '00000' }).one()}
      />,
    );

    // wait for component to be fully loaded
    await screen.findByRole('heading', { level: 3, name: product.title });

    expect(screen.queryByText('Sorry, no seats available for now')).not.toBeInTheDocument();
    screen.getByRole('button', { name: product.call_to_action });
    screen.getByText(relation.order_groups[1].nb_available_seats + ' remaining seats');
  });

  it('renders mutliple payment button when there are multiple order groups', async () => {
    const relation = CourseProductRelationFactory({
      order_groups: [OrderGroupFactory().one(), OrderGroupFactory({ nb_available_seats: 1 }).one()],
    }).one();
    const { product } = relation;
    const order = CredentialOrderFactory({
      product_id: product.id,
      course: CourseLightFactory({ code: '00000' }).one(),
      target_courses: product.target_courses,
      state: OrderState.PENDING,
    }).one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      relation,
    );
    const orderQueryParameters = {
      product_id: order.product_id,
      course_code: order.course?.code,
      state: ACTIVE_ORDER_STATES,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

    render(
      <CourseProductItem
        productId={product.id}
        course={CourseLightFactory({ code: '00000' }).one()}
      />,
    );

    // wait for component to be fully loaded
    await screen.findByRole('heading', { level: 3, name: product.title });

    expect(screen.queryByText('Sorry, no seats available for now')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('PurchaseButton__cta')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: product.call_to_action })).toHaveLength(2);
    screen.getByText(relation.order_groups[0].nb_available_seats + ' remaining seats');
    screen.getByText('Last remaining seat!');
  });
});
