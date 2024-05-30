import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import queryString from 'query-string';
import userEvent from '@testing-library/user-event';
import { OrderState, Product, ProductType } from 'types/Joanie';
import {
  AddressFactory,
  CertificateOrderWithOneClickPaymentFactory,
  CertificateOrderWithPaymentFactory,
  CertificateProductFactory,
  CourseFactory,
  CredentialOrderWithOneClickPaymentFactory,
  CredentialOrderWithPaymentFactory,
  CredentialProductFactory,
  CreditCardFactory,
  EnrollmentFactory,
} from 'utils/test/factories/joanie';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { render } from 'utils/test/render';
import { SaleTunnel, SaleTunnelProps } from 'components/SaleTunnel/index';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { getAddressLabel } from 'components/SaleTunnel/AddressSelector';
import { ObjectHelper } from 'utils/ObjectHelper';
import { PAYMENT_SETTINGS } from 'settings';
import { User } from 'types/User';
import { OpenEdxApiProfile } from 'types/openEdx';
import { OpenEdxApiProfileFactory } from 'utils/test/factories/openEdx';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';

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

jest.mock('../PaymentInterfaces');

describe.each([
  {
    productType: ProductType.CREDENTIAL,
    ProductFactory: CredentialProductFactory,
    OrderWithOneClickPaymentFactory: CredentialOrderWithOneClickPaymentFactory,
    OrderWithPaymentFactory: CredentialOrderWithPaymentFactory,
  },
  {
    productType: ProductType.CERTIFICATE,
    ProductFactory: CertificateProductFactory,
    OrderWithOneClickPaymentFactory: CertificateOrderWithOneClickPaymentFactory,
    OrderWithPaymentFactory: CertificateOrderWithPaymentFactory,
  },
])(
  'SaleTunnel for $productType product',
  ({ productType, ProductFactory, OrderWithOneClickPaymentFactory, OrderWithPaymentFactory }) => {
    let nbApiCalls: number;

    const course = CourseFactory().one();
    const enrollment =
      productType === ProductType.CERTIFICATE ? EnrollmentFactory().one() : undefined;

    let richieUser: User;
    let openApiEdxProfile: OpenEdxApiProfile;

    const formatPrice = (price: number, currency: string) =>
      new Intl.NumberFormat('en', {
        currency,
        style: 'currency',
      }).format(price);

    const Wrapper = (props: Omit<SaleTunnelProps, 'isOpen' | 'onClose'>) => {
      return (
        <SaleTunnel
          {...props}
          enrollment={enrollment}
          course={productType === ProductType.CREDENTIAL ? course : undefined}
          isOpen={true}
          onClose={() => {}}
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

      fetchMock.get(
        `https://auth.test/api/user/v1/accounts/${richieUser.username}`,
        openEdxAccount,
      );
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
            state: ['pending', 'validated', 'submitted'],
          }
        : {
            enrollment_id: enrollment?.id,
            product_id: product.id,
            state: ['pending', 'validated', 'submitted'],
          };
    };

    it('should render a payment button with a specific label when a credit card is provided', async () => {
      const product = ProductFactory().one();
      const creditCard = CreditCardFactory().one();
      const address = AddressFactory().one();

      fetchMock.get(`https://joanie.endpoint/api/v1.0/orders/`, [], {
        overwriteRoutes: true,
      });
      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
        [],
      );
      fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address], {
        overwriteRoutes: true,
      });
      fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', [creditCard], {
        overwriteRoutes: true,
      });

      render(<Wrapper product={product} />, {
        queryOptions: { client: createTestQueryClient({ user: richieUser }) },
      });

      const $button = (await screen.findByRole('button', {
        name: `Pay in one click ${formatPrice(product.price, product.price_currency)}`,
      })) as HTMLButtonElement;

      // a billing address is missing, but the button stays enabled
      // this allows the user to get feedback on what's missing to make the payment by clicking on the button
      expect($button.disabled).toBe(false);
    });

    it('should create an order only the first time the payment interface is shown, and not after aborting', async () => {
      const product = ProductFactory().one();
      const billingAddress = AddressFactory({
        is_main: true,
      }).one();
      const { payment_info: paymentInfo, ...order } = OrderWithPaymentFactory().one();

      fetchMock
        .get(
          `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
          [],
        )
        .post('https://joanie.endpoint/api/v1.0/orders/', order)
        .patch(`https://joanie.endpoint/api/v1.0/orders/${order.id}/submit/`, {
          paymentInfo,
        })
        .get(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`, {
          ...order,
        })
        .post(`https://joanie.endpoint/api/v1.0/orders/${order.id}/abort/`, HttpStatusCode.OK)
        .get('https://joanie.endpoint/api/v1.0/addresses/', [billingAddress], {
          overwriteRoutes: true,
        });

      render(<Wrapper product={product} />, {
        queryOptions: { client: createTestQueryClient({ user: richieUser }) },
      });
      nbApiCalls += 1; // useProductOrder call.
      nbApiCalls += 1; // get user account call.
      nbApiCalls += 1; // get user preferences call.
      await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));

      const $terms = screen.getByLabelText(
        'By checking this box, you accept the General Terms of Sale',
      );
      const user = userEvent.setup({ delay: null });
      await user.click($terms);

      const $button = screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // - Payment button should not be disabled.
      expect($button.disabled).toBe(false);

      // - wait for address to be loaded.
      await screen.findByText(getAddressLabel(billingAddress));

      // - Order should not have been submitted yet
      expect(
        fetchMock
          .calls()
          .filter(
            (call) => call[0] === `https://joanie.endpoint/api/v1.0/orders/${order.id}/submit/`,
          ),
      ).toHaveLength(0);

      // - User clicks on pay button
      await user.click($button);

      // - Route to create order should have been called
      nbApiCalls += 1; // order post create (invalidate queries)
      nbApiCalls += 1; // order get (invalidate queries)
      nbApiCalls += 1; // useProductOrder call (invalidate from create)
      nbApiCalls += 1; // order submit (invalidate queries)
      nbApiCalls += 1; // order get (invalidate queries)
      nbApiCalls += 1; // useProductOrder call (invalidate from submit)

      await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));
      expect(fetchMock.lastUrl()).toBe(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
      );

      // - Order should have been submitted once
      expect(
        fetchMock
          .calls()
          .filter(
            (call) => call[0] === `https://joanie.endpoint/api/v1.0/orders/${order.id}/submit/`,
          ),
      ).toHaveLength(1);

      // - Spinner should be displayed
      screen.getByText('Payment in progress');

      // - Payment interface should be displayed
      screen.getByText('Payment interface component');

      // - Simulate the payment aborting.
      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
        [
          {
            ...order,
            state: OrderState.PENDING,
          },
        ],
        { overwriteRoutes: true },
      );

      await user.click(screen.getByTestId('payment-abort'));

      nbApiCalls += 1; // abort order.
      nbApiCalls += 1; // order get (invalidate queries)
      nbApiCalls += 1; // useProductOrder call (invalidate from create)

      await waitFor(() => {
        expect(fetchMock.calls()).toHaveLength(nbApiCalls);
      });
      expect(fetchMock.calls()[fetchMock.calls().length - 3][0]).toBe(
        `https://joanie.endpoint/api/v1.0/orders/${order.id}/abort/`,
      );
      expect(fetchMock.calls()[fetchMock.calls().length - 1][0]).toBe(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
      );

      screen.getByText('You have aborted the payment.');

      // - User clicks on pay button again.
      await user.click($button);

      // - Spinner should be displayed
      await screen.findByText('Payment in progress');

      // - Payment interface should be displayed
      await screen.findByText('Payment interface component');

      // - Now we make sure the order is not created again and just submitted.
      nbApiCalls += 1; // order submit (invalidate queries)
      nbApiCalls += 1; // order get (invalidate queries)
      nbApiCalls += 1; // useProductOrder call (invalidate from submit)

      await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));

      // - Order should not have been re-submitted
      expect(
        fetchMock
          .calls()
          .filter(
            (call) => call[0] === `https://joanie.endpoint/api/v1.0/orders/${order.id}/submit/`,
          ),
      ).toHaveLength(2);
      expect(fetchMock.lastUrl()).toBe(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
      );
    });

    it('should render a payment button and not call the order creation route when there is a pending order', async () => {
      const product = ProductFactory().one();
      const billingAddress = AddressFactory({
        is_main: true,
      }).one();
      const creditCard = CreditCardFactory().one();
      const { payment_info: paymentInfo, ...order } = OrderWithOneClickPaymentFactory().one();

      const initialOrder = {
        ...order,
        state: OrderState.PENDING,
      };
      const orderSubmitted = {
        ...order,
        state: OrderState.SUBMITTED,
      };

      fetchMock
        .get(
          `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
          [initialOrder],
        )
        .post('https://joanie.endpoint/api/v1.0/orders/', order)
        .patch(`https://joanie.endpoint/api/v1.0/orders/${order.id}/submit/`, {
          payment_info: paymentInfo,
        })
        .get(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`, orderSubmitted)
        .get('https://joanie.endpoint/api/v1.0/credit-cards/', [creditCard], {
          overwriteRoutes: true,
        })
        .get('https://joanie.endpoint/api/v1.0/addresses/', [billingAddress], {
          overwriteRoutes: true,
        });

      render(<Wrapper product={product} />, {
        queryOptions: { client: createTestQueryClient({ user: richieUser }) },
      });
      await waitFor(() => {
        expect(screen.getByTestId('payment-button-order-loaded')).toBeInTheDocument();
      });

      const user = userEvent.setup({ delay: null });
      const $terms = screen.getByLabelText(
        'By checking this box, you accept the General Terms of Sale',
      );
      await user.click($terms);

      nbApiCalls += 1; // useProductOrder get order with filters
      nbApiCalls += 1; // get user account call.
      nbApiCalls += 1; // get user preferences call.
      await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));
      const $button = screen.getByRole('button', {
        name: `Pay in one click ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // - Payment button should not be disabled.
      expect($button.disabled).toBe(false);

      // - wait for address to be loaded.
      await screen.findByText(getAddressLabel(billingAddress));

      // - User clicks on pay button
      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
        [orderSubmitted],
        { overwriteRoutes: true },
      );
      await user.click($button);

      // - In real world condition the success callback is immediately called for one click payments.
      // - but here we need to click manually.
      const $success = await screen.findByTestId('payment-success');
      await user.click($success);

      // - Route to submit an existing order
      // - Furthermore, as payment succeeded immediately, order should have been refetched
      nbApiCalls += 1; // order submit
      nbApiCalls += 1; // order get (invalidate queries)
      nbApiCalls += 1; // useProductOrder call (invalidate from submit)
      nbApiCalls += 1; // order get on id
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);

      const submitCall = fetchMock
        .calls()
        .find((call) => call[0] === `https://joanie.endpoint/api/v1.0/orders/${order.id}/submit/`);
      expect(submitCall).not.toBeUndefined();
      expect(JSON.parse(submitCall![1]!.body as string)).toEqual({
        billing_address: ObjectHelper.omit(billingAddress, 'id', 'is_main'),
        credit_card_id: creditCard.id,
      });
      expect(fetchMock.lastUrl()).toBe(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`);

      // - Spinner should be displayed
      screen.getByText('Payment in progress');

      // - Order should be polled until its state is validated
      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/orders/${order.id}/`,
        {
          ...order,
          state: OrderState.VALIDATED,
        },
        {
          overwriteRoutes: true,
        },
      );

      // - Advance timer to one tick
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // - Order should have been refetched
      nbApiCalls += 1; // order get on id
      nbApiCalls += 1; // orders get (invalidate queries)
      nbApiCalls += 1; // useProductOrder call (invalidate from success)
      nbApiCalls += 1; // orders get (invalidate queries)
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);

      // - As order state is validated, success step is displayed
      screen.getByTestId('generic-sale-tunnel-success-step');
      screen.getByText('Congratulations!');
      // - And poller should be stopped
      await act(async () => {
        jest.runOnlyPendingTimers();
      });
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);
    });

    it('should render SaleTunnelNotValidated if order is not validated after a given delay', async () => {
      const product = ProductFactory().one();
      const billingAddress = AddressFactory({
        is_main: true,
      }).one();
      const creditCard = CreditCardFactory().one();
      const { payment_info: paymentInfo, ...order } = OrderWithOneClickPaymentFactory().one();
      const orderSubmitted = {
        ...order,
        state: OrderState.SUBMITTED,
      };

      fetchMock
        .get(
          `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
          [orderSubmitted],
        )
        .post('https://joanie.endpoint/api/v1.0/orders/', order)
        .patch(`https://joanie.endpoint/api/v1.0/orders/${order.id}/submit/`, {
          payment_info: paymentInfo,
        })
        .get(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`, orderSubmitted)
        .post(`https://joanie.endpoint/api/v1.0/orders/${order.id}/abort/`, HttpStatusCode.OK)
        .get('https://joanie.endpoint/api/v1.0/credit-cards/', [creditCard], {
          overwriteRoutes: true,
        })
        .get('https://joanie.endpoint/api/v1.0/addresses/', [billingAddress], {
          overwriteRoutes: true,
        });

      render(<Wrapper product={product} />, {
        queryOptions: { client: createTestQueryClient({ user: richieUser }) },
      });
      await waitFor(() => {
        expect(screen.getByTestId('payment-button-order-loaded')).toBeInTheDocument();
      });
      nbApiCalls += 1; // fetcher order for userProductOrder
      nbApiCalls += 1; // get user account call.
      nbApiCalls += 1; // get user preferences call.
      const apiCalls = fetchMock.calls().map((call) => call[0]);
      expect(apiCalls).toContain(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
      );

      const $terms = screen.getByLabelText(
        'By checking this box, you accept the General Terms of Sale',
      );
      const user = userEvent.setup({ delay: null });
      await user.click($terms);

      const $button = screen.getByRole('button', {
        name: `Pay in one click ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // - wait for address to be loaded.
      await screen.findByText(getAddressLabel(billingAddress));

      // - Payment button should not be disabled.
      expect($button.disabled).toBe(false);

      // - User clicks on pay button
      await user.click($button);

      // - In real world condition the success callback is immediately called for one click payments.
      // - but here we need to click manually.
      const $success = await screen.findByTestId('payment-success');
      await user.click($success);

      // - Route to create order should have been called
      // - Furthermore, as payment succeeded immediately, order should have been refetched
      const onClickApiCalls = fetchMock.calls().splice(nbApiCalls);
      nbApiCalls += 1; // order submit
      nbApiCalls += 1; // orders get (invalidate queries)
      nbApiCalls += 1; // refetch order (submit invalidate)
      nbApiCalls += 1; // fetch validated order
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);

      expect(onClickApiCalls[0][0]).toBe(
        `https://joanie.endpoint/api/v1.0/orders/${order.id}/submit/`,
      );
      expect(JSON.parse(onClickApiCalls[0][1]!.body as string)).toEqual({
        billing_address: ObjectHelper.omit(billingAddress, 'id', 'is_main'),
        credit_card_id: creditCard.id,
      });
      expect(onClickApiCalls[2][0]).toBe(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
      );
      expect(onClickApiCalls[3][0]).toBe(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`);

      // - Spinner should be displayed
      screen.getByText('Payment in progress');

      fetchMock.resetHistory();
      nbApiCalls = 0;
      // - Wait until order has been polled 29 times.
      await act(async () => {
        await jest.advanceTimersByTimeAsync(
          (PAYMENT_SETTINGS.pollLimit - 1) * PAYMENT_SETTINGS.pollInterval,
        );
      });

      await waitFor(async () => {
        expect(fetchMock.calls()).toHaveLength(PAYMENT_SETTINGS.pollLimit - 1);
        nbApiCalls += PAYMENT_SETTINGS.pollLimit - 1;
      });

      // - This round should be the last
      await act(async () => {
        jest.runOnlyPendingTimers();
        nbApiCalls += 1; // last poll round
      });

      nbApiCalls += 1; // useProductOrder call (invalidate)
      nbApiCalls += 1; // orders get (invalidate queries)

      // - The SaleTunnelNotValidated component should be rendered
      screen.getByTestId('generic-sale-tunnel-not-validated-step');
      screen.getByText("Sorry, you'll have to wait a little longer!");

      // If productType is credential, the button should redirect to the dashboard
      if (productType === ProductType.CREDENTIAL) {
        const $link = screen.getByRole('link', {
          name: 'Close',
        });
        expect($link.getAttribute('href')).toBe(`/en/dashboard/courses/orders/${order.id}`);
      } else {
        // Otherwise, the button should close the modal
        screen.getByRole('button', {
          name: 'Close',
        });
      }

      // - And poller should be stopped
      await act(async () => {
        jest.runOnlyPendingTimers();
      });
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);
    }, 10000);

    it('should render an error message when payment failed', async () => {
      const product = ProductFactory().one();
      const billingAddress = AddressFactory({
        is_main: true,
      }).one();
      const { payment_info: paymentInfo, ...order } = OrderWithPaymentFactory().one();

      fetchMock
        .get(
          `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
          [],
        )
        .post('https://joanie.endpoint/api/v1.0/orders/', order)
        .patch(`https://joanie.endpoint/api/v1.0/orders/${order.id}/submit/`, {
          payment_info: paymentInfo,
        })
        .get(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`, {
          ...order,
          state: OrderState.SUBMITTED,
        })
        .get('https://joanie.endpoint/api/v1.0/addresses/', [billingAddress], {
          overwriteRoutes: true,
        });

      render(<Wrapper product={product} />, {
        queryOptions: { client: createTestQueryClient({ user: richieUser }) },
      });
      nbApiCalls += 1; // useProductOrder get order with filters
      nbApiCalls += 1; // get user account call.
      nbApiCalls += 1; // get user preferences call.
      await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));

      const $terms = screen.getByLabelText(
        'By checking this box, you accept the General Terms of Sale',
      );
      const user = userEvent.setup({ delay: null });
      await user.click($terms);

      const $button = screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // - wait for address to be loaded.
      await screen.findByText(getAddressLabel(billingAddress));

      // - As all information are provided, payment button should not be disabled.
      expect($button.disabled).toBe(false);

      // - User clicks on pay button
      await user.click($button);

      // - Route to create order should have been called
      nbApiCalls += 1; // order post create (invalidate queries)
      nbApiCalls += 1; // order get (invalidate queries)
      nbApiCalls += 1; // useProductOrder call (invalidate from create)
      nbApiCalls += 1; // order submit (invalidate queries)
      nbApiCalls += 1; // order get (invalidate queries)
      nbApiCalls += 1; // useProductOrder call (invalidate from submit)

      await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));

      // - Spinner should be displayed and payment button should be disabled
      screen.getByText('Payment in progress');
      expect($button.disabled).toBe(true);

      // - Payment interface should be displayed
      await screen.findByText('Payment interface component');

      // - Simulate the payment has failed
      await act(async () => {
        fireEvent.click(screen.getByTestId('payment-failure'));
      });

      // - An error message should be displayed
      const $error = screen.getByText('An error occurred during payment. Please retry later.');
      expect(document.activeElement).toBe($error);
      // - Payment interface should have been closed
      expect(screen.queryByText('Payment interface component')).toBeNull();
      // - Payment button should have been restore to its idle state
      expect($button.disabled).toBe(false);
      screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      });
    });

    it('should resubmit the order when user retry to pay after a payment failure', async () => {
      const product = ProductFactory().one();
      const billingAddress = AddressFactory({
        is_main: true,
      }).one();
      const { payment_info: paymentInfo, ...order } = OrderWithPaymentFactory().one();

      fetchMock
        .get(
          `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
          [],
        )
        .post('https://joanie.endpoint/api/v1.0/orders/', order)
        .patch(`https://joanie.endpoint/api/v1.0/orders/${order.id}/submit/`, {
          payment_info: paymentInfo,
        })
        .get(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`, {
          ...order,
          state: OrderState.SUBMITTED,
        })
        .get('https://joanie.endpoint/api/v1.0/addresses/', [billingAddress], {
          overwriteRoutes: true,
        });

      render(<Wrapper product={product} />, {
        queryOptions: { client: createTestQueryClient({ user: richieUser }) },
      });
      nbApiCalls += 1; // useProductOrder get order with filters
      nbApiCalls += 1; // get user account call.
      nbApiCalls += 1; // get user preferences call.
      await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));

      const $terms = screen.getByLabelText(
        'By checking this box, you accept the General Terms of Sale',
      );
      const user = userEvent.setup({ delay: null });
      await user.click($terms);

      const $button = screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // - wait for address to be loaded.
      await screen.findByText(getAddressLabel(billingAddress));

      // - User clicks on pay button
      await user.click($button);

      // - Update the response of order list to react to order creation.
      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
        [
          {
            ...order,
            state: OrderState.SUBMITTED,
          },
        ],
        { overwriteRoutes: true },
      );

      // - Route to create order should have been called
      nbApiCalls += 1; // order post create (invalidate queries)
      nbApiCalls += 1; // order get (invalidate queries)
      nbApiCalls += 1; // useProductOrder call (invalidate from create)
      nbApiCalls += 1; // order submit (invalidate queries)
      nbApiCalls += 1; // order get (invalidate queries)
      nbApiCalls += 1; // useProductOrder call (invalidate from submit)

      await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));

      // - Payment interface should be displayed
      await screen.findByText('Payment interface component');

      // - Simulate the payment has failed
      await user.click(screen.getByTestId('payment-failure'));

      // - An error message should be displayed
      const $error = screen.getByText('An error occurred during payment. Please retry later.');
      expect(document.activeElement).toBe($error);

      // - Payment button should have been restore to its idle state
      expect($button.disabled).toBe(false);
      screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      });

      // - User clicks on pay button again
      await user.click($button);

      nbApiCalls += 1; // order submit (invalidate queries)
      nbApiCalls += 1; // order get (invalidate queries)
      nbApiCalls += 1; // useProductOrder call (invalidate from submit)
      await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));
    });

    it('should show an error if user does not accept the terms', async () => {
      const product = ProductFactory().one();
      const billingAddress = AddressFactory({ is_main: true }).one();

      fetchMock
        .get(
          `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(getFetchOrderQueryParams(product))}`,
          [],
        )
        .get('https://joanie.endpoint/api/v1.0/addresses/', [billingAddress], {
          overwriteRoutes: true,
        });

      render(<Wrapper product={product} />, {
        queryOptions: { client: createTestQueryClient({ user: richieUser }) },
      });

      const $button = screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // - As all information are provided, payment button should not be disabled.
      expect($button.disabled).toBe(false);

      expect(screen.queryByText('You must accept the terms')).not.toBeInTheDocument();

      // - User clicks on pay button
      await act(async () => {
        fireEvent.click($button);
      });

      expect(screen.getByText('You must accept the terms.')).toBeInTheDocument();
    });

    it('should show a link to the platform terms and conditions', async () => {
      const product = ProductFactory().one();

      const fetchOrderQueryParams =
        product.type === ProductType.CREDENTIAL
          ? {
              course_code: course.code,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            }
          : {
              enrollment_id: enrollment?.id,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            };

      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
        [],
      );

      render(<Wrapper product={product} />, {
        queryOptions: { client: createTestQueryClient({ user: richieUser }) },
      });

      const $terms = screen.getByRole('link', { name: 'General Terms of Sale' });
      expect($terms).toHaveAttribute('href', '/en/about/terms-and-conditions/');
    });
  },
);
