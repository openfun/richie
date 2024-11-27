import { act, cleanup, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import queryString from 'query-string';
import userEvent from '@testing-library/user-event';
import { within } from '@testing-library/dom';
import { createIntl } from 'react-intl';
import { useState } from 'react';
import { OrderState, Product, ProductType, NOT_CANCELED_ORDER_STATES } from 'types/Joanie';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
  PacedCourseFactory,
} from 'utils/test/factories/richie';
import {
  AddressFactory,
  CertificateOrderFactory,
  CertificateProductFactory,
  CredentialOrderFactory,
  CredentialProductFactory,
  CreditCardFactory,
  EnrollmentFactory,
  PaymentInstallmentFactory,
} from 'utils/test/factories/joanie';
import { render } from 'utils/test/render';
import { SaleTunnel, SaleTunnelProps } from 'components/SaleTunnel/index';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { HttpError, HttpStatusCode } from 'utils/errors/HttpError';
import { getAddressLabel } from 'components/SaleTunnel/AddressSelector';
import { User } from 'types/User';
import { OpenEdxApiProfile } from 'types/openEdx';
import { OpenEdxApiProfileFactory } from 'utils/test/factories/openEdx';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { StringHelper } from 'utils/StringHelper';
import { DEFAULT_DATE_FORMAT } from 'hooks/useDateFormat';
import { Deferred } from 'utils/test/deferred';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
    site_urls: {
      terms_and_conditions: '/en/about/terms-and-conditions/',
    },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  matchMedia: () => ({
    matches: true,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }),
}));

jest.mock('./SaleTunnelSavePaymentMethod', () => ({
  __esModule: true,
  default: () => <div data-testid="sale-tunnel-save-payment-method-step" />,
}));
jest.mock('components/ContractFrame/LearnerContractFrame', () => ({
  __esModule: true,
  default: () => <div data-testid="sale-tunnel-sign-step" />,
}));

describe.each([
  {
    productType: ProductType.CREDENTIAL,
    ProductFactory: CredentialProductFactory,
    OrderFactory: CredentialOrderFactory,
  },
  {
    productType: ProductType.CERTIFICATE,
    ProductFactory: CertificateProductFactory,
    OrderFactory: CertificateOrderFactory,
  },
])('SaleTunnel for $productType product', ({ productType, ProductFactory, OrderFactory }) => {
  let nbApiCalls: number;

  const course = PacedCourseFactory().one();
  const enrollment =
    productType === ProductType.CERTIFICATE
      ? EnrollmentFactory({ course_run: { course } }).one()
      : undefined;

  let richieUser: User;
  let openApiEdxProfile: OpenEdxApiProfile;

  const formatPrice = (price: number, currency: string) =>
    new Intl.NumberFormat('en', {
      currency,
      style: 'currency',
    }).format(price);

  const Wrapper = (props: Omit<SaleTunnelProps, 'isOpen' | 'onClose'>) => {
    const [open, setOpen] = useState(true);
    return (
      <SaleTunnel
        {...props}
        enrollment={enrollment}
        course={productType === ProductType.CREDENTIAL ? course : undefined}
        isOpen={open}
        onClose={() => setOpen(false)}
      />
    );
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllTimers();
    jest.resetAllMocks();

    fetchMock.restore();
    sessionStorage.clear();

    nbApiCalls = 3;

    richieUser = UserFactory().one();
    openApiEdxProfile = OpenEdxApiProfileFactory({
      username: richieUser.username,
      email: richieUser.email,
      name: richieUser.full_name,
    }).one();

    const { 'pref-lang': prefLang, ...openEdxAccount } = openApiEdxProfile;

    fetchMock.get(`https://auth.test/api/user/v1/accounts/${richieUser.username}`, openEdxAccount);
    fetchMock.get(`https://auth.test/api/user/v1/preferences/${richieUser.username}`, {
      'pref-lang': prefLang,
    });
  });

  setupJoanieSession();

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    cleanup();
  });

  const getFetchOrderQueryParams = (product: Product) => {
    return product.type === ProductType.CREDENTIAL
      ? {
          course_code: course.code,
          product_id: product.id,
          state: NOT_CANCELED_ORDER_STATES,
        }
      : {
          enrollment_id: enrollment?.id,
          product_id: product.id,
          state: NOT_CANCELED_ORDER_STATES,
        };
  };

  it('should create an order when the user clicks on subscribe button', async () => {
    const product = ProductFactory().one();
    const billingAddress = AddressFactory({
      is_main: true,
    }).one();
    const order = OrderFactory({ state: OrderState.TO_SAVE_PAYMENT_METHOD }).one();

    fetchMock
      .get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
        [],
      )
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-schedule/`,
        [],
      )
      .post('https://joanie.endpoint/api/v1.0/orders/', order)
      .get(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`, order)
      .get('https://joanie.endpoint/api/v1.0/addresses/', [billingAddress], {
        overwriteRoutes: true,
      });

    render(<Wrapper product={product} isWithdrawable={true} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });
    nbApiCalls += 1; // useProductOrder call.
    nbApiCalls += 1; // get user account call.
    nbApiCalls += 1; // get user preferences call.
    nbApiCalls += 1; // product payment-schedule call
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));

    const user = userEvent.setup({ delay: null });

    const $button = screen.getByRole<HTMLButtonElement>('button', {
      name: `Subscribe`,
    });

    // - wait for address to be loaded.
    await screen.findByText(getAddressLabel(billingAddress));

    // - Subscribe button should not be disabled.
    expect($button.disabled).toBe(false);

    // - Order should not have been created yet
    expect(
      fetchMock
        .calls()
        .filter(
          ([url, metadata]) =>
            url === 'https://joanie.endpoint/api/v1.0/orders/' && metadata?.method === 'POST',
        ),
    ).toHaveLength(0);

    // - User clicks on pay button
    await user.click($button);

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
      [order],
      { overwriteRoutes: true },
    );

    // - Route to create order should have been called
    nbApiCalls += 1; // order create
    nbApiCalls += 1; // useProductOrder call (invalidate from create)

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));
    expect(fetchMock.lastUrl()).toBe(
      `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
    );

    // - Order should have been created once
    expect(
      fetchMock
        .calls()
        .filter(
          ([url, metadata]) =>
            url === 'https://joanie.endpoint/api/v1.0/orders/' && metadata?.method === 'POST',
        ),
    ).toHaveLength(1);

    // - Spinner should be displayed
    screen.getByText('Order creation in progress');

    // - Save payment step should be displayed
    await screen.findByTestId('sale-tunnel-save-payment-method-step');
  });

  it('should render an error message when order creation fails', async () => {
    const product = ProductFactory().one();
    const billingAddress = AddressFactory({
      is_main: true,
    }).one();
    const deferred = new Deferred();

    fetchMock
      .get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
        [],
      )
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-schedule/`,
        [],
      )
      .post('https://joanie.endpoint/api/v1.0/orders/', deferred.promise)
      .get('https://joanie.endpoint/api/v1.0/addresses/', [billingAddress], {
        overwriteRoutes: true,
      });

    render(<Wrapper product={product} isWithdrawable={true} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });
    nbApiCalls += 1; // useProductOrder get order with filters
    nbApiCalls += 1; // get user account call.
    nbApiCalls += 1; // get user preferences call.
    nbApiCalls += 1; // get product payment schedule.
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));

    const user = userEvent.setup({ delay: null });

    const $button = screen.getByRole('button', {
      name: `Subscribe`,
    }) as HTMLButtonElement;

    // - wait for address to be loaded.
    await screen.findByText(getAddressLabel(billingAddress));

    // - As all information are provided, subscribe button should not be disabled.
    expect($button.disabled).toBe(false);

    // - User clicks on subscribe button
    await user.click($button);

    // - Route to create order should have been called
    nbApiCalls += 1; // order post create (no query invalidation)

    await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));

    // - Spinner should be displayed and subscribe button should be disabled
    screen.getByText('Order creation in progress');
    expect($button.disabled).toBe(true);

    // - Simulate the order creation has failed
    await act(async () => {
      deferred.reject(
        new HttpError(HttpStatusCode.BAD_REQUEST, 'An error occurred during order creation.'),
      );
    });

    // - An error message should be displayed
    const $error = screen.getByText('An error occurred during order creation. Please retry later.');
    expect(document.activeElement).toBe($error);

    // - Payment button should have been restore to its idle state
    expect($button.disabled).toBe(false);
    screen.getByRole('button', {
      name: 'Subscribe',
    });
  });

  it('should start at the save payment method step if order is in state to_save_payment_method', async () => {
    const product = ProductFactory().one();
    const billingAddress = AddressFactory({
      is_main: true,
    }).one();
    const creditCard = CreditCardFactory().one();
    const order = OrderFactory({ state: OrderState.TO_SAVE_PAYMENT_METHOD }).one();

    fetchMock
      .get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
        [order],
      )
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-schedule/`,
        [],
      )
      .get('https://joanie.endpoint/api/v1.0/credit-cards/', [creditCard], {
        overwriteRoutes: true,
      })
      .get('https://joanie.endpoint/api/v1.0/addresses/', [billingAddress], {
        overwriteRoutes: true,
      });

    render(<Wrapper product={product} isWithdrawable={true} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    nbApiCalls += 3;
    await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));

    await screen.findByTestId('sale-tunnel-save-payment-method-step');
  });

  it.each([OrderState.TO_SIGN, OrderState.SIGNING])(
    'should start at the sign step if order is in state %s',
    async (state) => {
      const product = ProductFactory().one();
      const billingAddress = AddressFactory({
        is_main: true,
      }).one();
      const creditCard = CreditCardFactory().one();
      const order = OrderFactory({ state }).one();

      fetchMock
        .get(
          `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
          [order],
        )
        .get(
          `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-schedule/`,
          [],
        )
        .get('https://joanie.endpoint/api/v1.0/credit-cards/', [creditCard], {
          overwriteRoutes: true,
        })
        .get('https://joanie.endpoint/api/v1.0/addresses/', [billingAddress], {
          overwriteRoutes: true,
        });

      render(<Wrapper product={product} isWithdrawable={true} />, {
        queryOptions: { client: createTestQueryClient({ user: richieUser }) },
      });

      nbApiCalls += 3;
      await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));

      await screen.findByTestId('sale-tunnel-sign-step');
    },
  );

  it('should show the product payment schedule', async () => {
    const intl = createIntl({ locale: 'en' });
    const product = ProductFactory().one();
    const schedule = PaymentInstallmentFactory().many(2);
    fetchMock
      .get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
        [],
      )
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-schedule/`,
        schedule,
      );

    render(<Wrapper product={product} isWithdrawable={true} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    await screen.findByRole('heading', {
      level: 4,
      name: 'Payment schedule',
    });

    const scheduleTable = screen.getByRole('table');
    const scheduleTableRows = within(scheduleTable).getAllByRole('row');
    expect(scheduleTableRows).toHaveLength(schedule.length);

    scheduleTableRows.forEach((row, index) => {
      const installment = schedule[index];
      // A first column should show the installment index
      within(row).getByRole('cell', {
        name: (index + 1).toString(),
      });
      // A 2nd column should show the installment amount
      within(row).getByRole('cell', {
        name: formatPrice(installment.amount, installment.currency),
      });
      // A 3rd column should show the installment withdraw date
      within(row).getByRole('cell', {
        name: `Withdrawn on ${intl.formatDate(installment.due_date, {
          ...DEFAULT_DATE_FORMAT,
        })}`,
      });
      // A 4th column should show the installment state
      within(row).getByRole('cell', {
        name: StringHelper.capitalizeFirst(installment.state.replace('_', ' '))!,
      });
    });
  });

  it('should show a walkthrough to explain the subscription process', async () => {
    const product = ProductFactory().one();
    const schedule = PaymentInstallmentFactory().many(2);
    fetchMock
      .get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
        [],
      )
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-schedule/`,
        schedule,
      );

    render(<Wrapper product={product} isWithdrawable={true} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    screen.getByTestId('walkthrough-banner');
  });

  it('should show a checkbox to waive withdrawal right if the product is not withdrawable', async () => {
    const product = ProductFactory().one();
    const schedule = PaymentInstallmentFactory().many(2);
    fetchMock
      .get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
        [],
      )
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-schedule/`,
        schedule,
      );

    render(<Wrapper product={product} isWithdrawable={false} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    screen.getByTestId('withdraw-right-checkbox');
  });

  it('should not show a checkbox to waive withdrawal right if the product is withdrawable', async () => {
    const product = ProductFactory().one();
    const schedule = PaymentInstallmentFactory().many(2);
    fetchMock
      .get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
        [],
      )
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-schedule/`,
        schedule,
      );

    render(<Wrapper product={product} isWithdrawable={true} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    expect(screen.queryByTestId('withdraw-right-checkbox')).toBeNull();
  });

  it('should show a specific checkbox to waive withdrawal right according to the product type', async () => {
    const product = ProductFactory().one();
    const schedule = PaymentInstallmentFactory().many(2);
    fetchMock
      .get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
        [],
      )
      .get(
        `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${product.id}/payment-schedule/`,
        schedule,
      );

    render(<Wrapper product={product} isWithdrawable={false} />, {
      queryOptions: { client: createTestQueryClient({ user: richieUser }) },
    });

    screen.getByTestId('withdraw-right-checkbox');

    const expectedMessages =
      productType === ProductType.CERTIFICATE
        ? [
            'If you access the exam, you acknowledge waiving your 14-day withdrawal right, as provided for in Article L221-18 of the French Consumer Code.',
            'I acknowledge that I have been informed of my legal right of withdrawal, which allows me to cancel my registration within 14 days from the date of payment.',
            'I understand that if I access the exam during this period, I expressly waive my right of withdrawal.',
          ]
        : [
            'The training program you wish to enroll in begins before the end of the 14-day withdrawal period mentioned in Article L221-18 of the French Consumer Code. You must check the box below to proceed with your registration.',
            'I acknowledge that I have expressly requested to begin the training before the expiration date of the withdrawal period.',
            'I expressly waive my right of withdrawal in order to begin the training before the expiration of the withdrawal period.',
          ];

    expectedMessages.forEach((message) => {
      screen.getByText(message);
    });
  });
});
