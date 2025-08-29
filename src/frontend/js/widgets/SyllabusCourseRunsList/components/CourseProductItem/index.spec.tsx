import { getByText, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import queryString from 'query-string';
import {
  RichieContextFactory as mockRichieContextFactory,
  PacedCourseFactory,
} from 'utils/test/factories/richie';
import {
  OfferingFactory,
  EnrollmentFactory,
  CredentialOrderFactory,
  ProductFactory,
  CredentialProductFactory,
} from 'utils/test/factories/joanie';
import {
  CourseRun,
  Enrollment,
  CredentialOrder,
  OrderState,
  PURCHASABLE_ORDER_STATES,
  ENROLLABLE_ORDER_STATES,
  NOT_CANCELED_ORDER_STATES,
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
    const offering = OfferingFactory().one();
    const { product } = offering;
    const productDeferred = new Deferred();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      productDeferred.promise,
    );

    render(
      <CourseProductItem
        course={PacedCourseFactory({ code: '00000' }).one()}
        productId={product.id}
      />,
      { queryOptions: { client: createTestQueryClient({ user: null }) } },
    );

    // - A loader should be displayed while product information are fetching
    await expectSpinner('Loading product information...');
    productDeferred.resolve(offering);
    await expectNoSpinner('Loading product information...');
  });

  it('renders product information for anonymous user', async () => {
    const offering = OfferingFactory().one();
    const { product } = offering;
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      offering,
    );

    render(
      <CourseProductItem
        course={PacedCourseFactory({ code: '00000' }).one()}
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
    offering.product.target_courses.forEach((course) => {
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

  it('renders discount rate for anonymous user', async () => {
    const offering = OfferingFactory({
      product: CredentialProductFactory({
        price: 840,
        price_currency: 'EUR',
      }).one(),
      rules: {
        discounted_price: 800,
        discount_rate: 0.3,
        description: 'Year 2023 discount',
        discount_start: new Date('2023-01-01T00:00:00Z').toISOString(),
        discount_end: new Date('2023-12-31T23:59:59Z').toISOString(),
      },
    }).one();
    const { product } = offering;
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      offering,
    );

    render(
      <CourseProductItem
        course={PacedCourseFactory({ code: '00000' }).one()}
        productId={product.id}
      />,
      { queryOptions: { client: createTestQueryClient({ user: null }) } },
    );

    await screen.findByRole('heading', { level: 3, name: product.title });

    // - Render discount information
    // Original price should be displayed as a del element
    const originalPriceLabel = screen.getByText('Original price:');
    expect(originalPriceLabel.classList.contains('offscreen')).toBe(true);
    const originalPrice = screen.getByText(
      priceFormatter(product.price_currency, product.price).replace(/(\u202F|\u00a0)/g, ' '),
    );
    expect(originalPrice.tagName).toBe('DEL');
    expect(originalPrice.getAttribute('aria-describedby')).toEqual(originalPriceLabel.id);

    // Discounted price should be displayed as an ins element
    const discountedPriceLabel = screen.getByText('Discounted price:');
    expect(discountedPriceLabel.classList.contains('offscreen')).toBe(true);
    const discountedPrice = screen.getByText(
      priceFormatter(product.price_currency, offering.rules!.discounted_price!).replace(
        /(\u202F|\u00a0)/g,
        ' ',
      ),
    );
    expect(discountedPrice.tagName).toBe('INS');
    expect(discountedPrice.getAttribute('aria-describedby')).toEqual(discountedPriceLabel.id);

    // Discount description should be displayed
    screen.getByText('Year 2023 discount');

    // Discount rate should be displayed
    screen.getByText('-30%');

    // Discount date range should be displayed
    screen.getByText('from Jan 01, 2023');
    screen.getByText('to Dec 31, 2023');
  });

  it('renders discount amount for anonymous user', async () => {
    const offering = OfferingFactory({
      product: CredentialProductFactory({
        price: 840,
        price_currency: 'EUR',
      }).one(),
      rules: {
        discounted_price: 800,
        discount_amount: 40,
        description: 'Year 2023 discount',
        discount_start: new Date('2023-01-01T00:00:00Z').toISOString(),
        discount_end: new Date('2023-12-31T23:59:59Z').toISOString(),
      },
    }).one();
    const { product } = offering;
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      offering,
    );

    render(
      <CourseProductItem
        course={PacedCourseFactory({ code: '00000' }).one()}
        productId={product.id}
      />,
      { queryOptions: { client: createTestQueryClient({ user: null }) } },
    );

    await screen.findByRole('heading', { level: 3, name: product.title });

    // - Render discount information
    // Original price should be displayed as a del element
    const originalPriceLabel = screen.getByText('Original price:');
    expect(originalPriceLabel.classList.contains('offscreen')).toBe(true);
    const originalPrice = screen.getByText(
      priceFormatter(product.price_currency, product.price).replace(/(\u202F|\u00a0)/g, ' '),
    );
    expect(originalPrice.tagName).toBe('DEL');
    expect(originalPrice.getAttribute('aria-describedby')).toEqual(originalPriceLabel.id);

    // Discounted price should be displayed as an ins element
    const discountedPriceLabel = screen.getByText('Discounted price:');
    expect(discountedPriceLabel.classList.contains('offscreen')).toBe(true);
    const discountedPrice = screen.getByText(
      priceFormatter(product.price_currency, offering.rules!.discounted_price!).replace(
        /(\u202F|\u00a0)/g,
        ' ',
      ),
    );
    expect(discountedPrice.tagName).toBe('INS');
    expect(discountedPrice.getAttribute('aria-describedby')).toEqual(discountedPriceLabel.id);

    // Discount description should be displayed
    screen.getByText('Year 2023 discount');

    // Discount rate should be displayed
    screen.getByText(priceFormatter(product.price_currency, -40).replace(/(\u202F|\u00a0)/g, ' '));

    // Discount date range should be displayed
    screen.getByText('from Jan 01, 2023');
    screen.getByText('to Dec 31, 2023');
  });

  it('does not render <CertificateItem /> if product do not have a certificate', async () => {
    const offering = OfferingFactory({
      product: ProductFactory({
        certificate_definition: undefined,
      }).one(),
    }).one();
    const { product } = offering;
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      offering,
    );

    render(
      <CourseProductItem
        productId={product.id}
        course={PacedCourseFactory({ code: '00000' }).one()}
      />,
      { queryOptions: { client: createTestQueryClient({ user: null }) } },
    );

    // Wait for product information to be fetched
    await screen.findByRole('heading', { level: 3, name: product.title });

    // - Does not render <CertificateItem />
    expect(screen.queryByTestId('CertificateItem')).toBeNull();
  });

  it('renders product information in compact mode', async () => {
    const offering = OfferingFactory().one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${offering.product.id}/`,
      offering,
    );

    const { container } = render(
      <CourseProductItem
        course={PacedCourseFactory({ code: '00000' }).one()}
        productId={offering.product.id}
        compact
      />,
      { queryOptions: { client: createTestQueryClient({ user: null }) } },
    );

    // In the header, we should display the product title, the product price
    // and product date range and languages
    await screen.findByRole('heading', { level: 3, name: offering.product.title });
    // the price shouldn't be a heading to prevent misdirection for screen reader users,
    // but we want to it to visually look like a h6

    const $price = screen.getByText(
      // the price formatter generates non-breaking spaces and getByText doesn't seem to handle that well, replace it
      // with a regular space. We replace NNBSP (\u202F) and NBSP (\u00a0) with a regular space
      priceFormatter(offering.product.price_currency, offering.product.price).replace(
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
    offering.product.target_courses.forEach((course) => {
      const $item = screen.queryByTestId(`course-item-${course.code}`);
      expect($item).not.toBeInTheDocument();
    });

    // - Any <CertificateItem /> should be displayed
    expect(screen.queryByTestId('CertificateItem')).not.toBeInTheDocument();

    // - Render a login button
    screen.getByRole('button', { name: `Login to purchase "${offering.product.title}"` });
    // - Does not render PurchaseButton cta
    expect(screen.queryByTestId('PurchaseButton__cta')).not.toBeInTheDocument();
  });

  it.each([OrderState.PENDING, OrderState.NO_PAYMENT])(
    'renders product informations for %s order',
    async (state) => {
      const offering = OfferingFactory().one();
      const { product } = offering;
      const order = CredentialOrderFactory({
        product_id: product.id,
        course: PacedCourseFactory({ code: '00000' }).one(),
        target_courses: product.target_courses,
        state,
      }).one();

      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
        offering,
      );
      const orderQueryParameters = {
        course_code: order.course.code,
        product_id: order.product_id,
        state: NOT_CANCELED_ORDER_STATES,
      };
      const queryParams = queryString.stringify(orderQueryParameters);
      const url = `https://joanie.endpoint/api/v1.0/orders/?${queryParams}`;
      fetchMock.get(url, [order]);

      render(
        <CourseProductItem
          course={PacedCourseFactory({ code: '00000' }).one()}
          productId={offering.product.id}
        />,
      );

      // In the header, we should display the product title, the product price
      // and product date range and languages
      await screen.findByRole('heading', { level: 3, name: offering.product.title });
      // the price shouldn't be a heading to prevent misdirection for screen reader users,
      // but we want to it to visually look like a h6

      // - In place of product price, a label should be displayed
      const $enrolledInfo = await screen.findByText('Purchased');
      expect($enrolledInfo.tagName).toBe('STRONG');
      expect($enrolledInfo.classList.contains('h6')).toBe(true);

      // - Render all order's target courses information with CourseRunList component
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

      // - Does not render PurchaseButton cta
      expect(screen.queryByTestId('PurchaseButton__cta')).not.toBeInTheDocument();
    },
  );

  it.each([OrderState.PENDING, OrderState.NO_PAYMENT])(
    'renders product informations for %s order in compact mode',
    async (state) => {
      const offering = OfferingFactory().one();
      const { product } = offering;
      const order = CredentialOrderFactory({
        product_id: product.id,
        course: PacedCourseFactory({ code: '00000' }).one(),
        target_courses: product.target_courses,
        state,
      }).one();

      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
        offering,
      );
      const orderQueryParameters = {
        course_code: order.course.code,
        product_id: order.product_id,
        state: NOT_CANCELED_ORDER_STATES,
      };
      const queryParams = queryString.stringify(orderQueryParameters);
      const url = `https://joanie.endpoint/api/v1.0/orders/?${queryParams}`;
      fetchMock.get(url, [order]);

      render(
        <CourseProductItem
          course={PacedCourseFactory({ code: '00000' }).one()}
          productId={offering.product.id}
          compact
        />,
      );

      // In the header, we should display the product title, the product price
      // and product date range and languages
      await screen.findByRole('heading', { level: 3, name: offering.product.title });
      // the price shouldn't be a heading to prevent misdirection for screen reader users,
      // but we want to it to visually look like a h6

      // - In place of product price, a label should be displayed
      const $enrolledInfo = await screen.findByText('Purchased');
      expect($enrolledInfo.tagName).toBe('STRONG');
      expect($enrolledInfo.classList.contains('h6')).toBe(true);

      // - Any target courses information should be displayed
      offering.product.target_courses.forEach((course) => {
        const $item = screen.queryByTestId(`course-item-${course.code}`);
        expect($item).not.toBeInTheDocument();
      });

      // - Does not render PurchaseButton cta
      expect(screen.queryByTestId('PurchaseButton__cta')).not.toBeInTheDocument();
    },
  );

  it.each(ENROLLABLE_ORDER_STATES)('renders product information for a %s order', async (state) => {
    const offering = OfferingFactory().one();
    const { product } = offering;
    const order = CredentialOrderFactory({
      product_id: product.id,
      course: PacedCourseFactory({ code: '00000' }).one(),
      target_courses: product.target_courses,
      state,
    }).one();

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      offering,
    );
    const orderQueryParameters = {
      course_code: order.course.code,
      product_id: order.product_id,
      state: NOT_CANCELED_ORDER_STATES,
    };
    const queryParams = queryString.stringify(orderQueryParameters);
    const url = `https://joanie.endpoint/api/v1.0/orders/?${queryParams}`;
    fetchMock.get(url, [order]);

    render(
      <CourseProductItem
        productId={product.id}
        course={PacedCourseFactory({ code: '00000' }).one()}
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

  it.each(ENROLLABLE_ORDER_STATES)(
    'renders product informations for a %s order in compact mode',
    async (state) => {
      const offering = OfferingFactory().one();
      const order: CredentialOrder = CredentialOrderFactory({
        product_id: offering.product.id,
        course: PacedCourseFactory({ code: '00000' }).one(),
        target_courses: offering.product.target_courses,
        state,
      }).one();

      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/courses/00000/products/${offering.product.id}/`,
        offering,
      );
      const orderQueryParameters = {
        product_id: order.product_id,
        course_code: order.course?.code,
        state: NOT_CANCELED_ORDER_STATES,
      };
      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
        [order],
      );

      render(
        <CourseProductItem
          productId={offering.product.id}
          course={PacedCourseFactory({ code: '00000' }).one()}
          compact
        />,
      );

      // Wait for product information to be fetched
      await screen.findByRole('heading', { level: 3, name: offering.product.title });

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
    },
  );

  it('renders enrollment information when user is enrolled to a course run', async () => {
    const offering = OfferingFactory().one();
    const { product } = offering;
    // - Create an order with an active enrollment
    const enrollment: Enrollment = EnrollmentFactory({
      course_run: product.target_courses[0]!.course_runs[0]! as CourseRun,
    }).one();
    const order: CredentialOrder = CredentialOrderFactory({
      product_id: product.id,
      course: PacedCourseFactory({ code: '00000' }).one(),
      target_courses: product.target_courses,
      target_enrollments: [enrollment],
    }).one();

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      offering,
    );
    const orderQueryParameters = {
      product_id: order.product_id,
      course_code: order.course?.code,
      state: NOT_CANCELED_ORDER_STATES,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

    render(
      <CourseProductItem
        productId={product.id}
        course={PacedCourseFactory({ code: '00000' }).one()}
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

  it.each(PURCHASABLE_ORDER_STATES)(
    'renders sale tunnel button if user already has a %s order',
    async (state) => {
      const offering = OfferingFactory().one();
      const { product } = offering;
      const order = CredentialOrderFactory({
        product_id: product.id,
        course: PacedCourseFactory({ code: '00000' }).one(),
        target_courses: product.target_courses,
        state,
      }).one();
      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
        offering,
      );
      const orderQueryParameters = {
        product_id: order.product_id,
        course_code: order.course?.code,
        state: NOT_CANCELED_ORDER_STATES,
      };
      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
        [order],
      );

      render(
        <CourseProductItem
          productId={product.id}
          course={PacedCourseFactory({ code: '00000' }).one()}
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
      offering.product.target_courses.forEach((course) => {
        const $item = screen.getByTestId(`course-item-${course.code}`);
        // the course title shouldn't be a heading to prevent misdirection for screen reader users,
        // but we want to it to visually look like a h5
        const $courseTitle = getByText($item, course.title);
        expect($courseTitle.tagName).toBe('STRONG');
        expect($courseTitle.classList.contains('h5')).toBe(true);
        screen.getByTestId(`CourseRunList-${course.course_runs.map(({ id }) => id).join('-')}`);
      });

      screen.getByRole('button', { name: product.call_to_action });
    },
  );

  it('renders sale tunnel button if user already has a canceled order', async () => {
    const offering = OfferingFactory().one();
    const { product } = offering;
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      offering,
    );
    const orderQueryParameters = {
      product_id: product.id,
      course_code: '00000',
      state: NOT_CANCELED_ORDER_STATES,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [],
    );

    render(
      <CourseProductItem
        productId={product.id}
        course={PacedCourseFactory({ code: '00000' }).one()}
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
    offering.product.target_courses.forEach((course) => {
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

  it('renders error message when product fetching has failed', async () => {
    const { product } = OfferingFactory().one();

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      HttpStatusCode.NOT_FOUND,
      {},
    );

    render(
      <CourseProductItem
        productId={product.id}
        course={PacedCourseFactory({ code: '00000' }).one()}
      />,
      { queryOptions: { client: createTestQueryClient({ user: null }) } },
    );

    // - As product fetching has failed, an error message should be displayed
    await screen.findByText('An error occurred while fetching product. Please retry later.');
  });

  it('renders a warning message that tells that no seats are left', async () => {
    const offering = OfferingFactory({
      rules: {
        nb_available_seats: 0,
        has_seats_left: false,
      },
    }).one();
    const { product } = offering;
    const order = CredentialOrderFactory({
      product_id: product.id,
      course: PacedCourseFactory({ code: '00000' }).one(),
      target_courses: product.target_courses,
      state: OrderState.DRAFT,
    }).one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      offering,
    );
    const orderQueryParameters = {
      product_id: order.product_id,
      course_code: order.course?.code,
      state: NOT_CANCELED_ORDER_STATES,
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(orderQueryParameters)}`,
      [order],
    );

    render(
      <CourseProductItem
        productId={product.id}
        course={PacedCourseFactory({ code: '00000' }).one()}
      />,
    );

    // wait for component to be fully loaded
    await screen.findByRole('heading', { level: 3, name: product.title });

    expect(screen.queryByRole('button', { name: product.call_to_action })).not.toBeInTheDocument();
    screen.getByText('Sorry, no seats available for now');
  });

  it('renders product information without rules in offering', async () => {
    const offering = OfferingFactory({
      product: CredentialProductFactory({
        price: 840,
        price_currency: 'EUR',
      }).one(),
      rules: undefined,
    }).one();
    const { product } = offering;
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/00000/products/${product.id}/`,
      offering,
    );

    render(
      <CourseProductItem
        course={PacedCourseFactory({ code: '00000' }).one()}
        productId={product.id}
      />,
      { queryOptions: { client: createTestQueryClient({ user: null }) } },
    );

    // Wait for product information to be fetched
    await screen.findByRole('heading', { level: 3, name: product.title });

    // Expect to render the component without rules information
    expect(
      screen.getByText(
        priceFormatter(product.price_currency, product.price).replace(/(\u202F|\u00a0)/g, ' '),
      ),
    ).toBeInTheDocument();
    expect(document.querySelector('.product-widget__price-discounted')).not.toBeInTheDocument();
    expect(screen.getByText('Sorry, no seats available for now')).toBeInTheDocument();
  });
});
