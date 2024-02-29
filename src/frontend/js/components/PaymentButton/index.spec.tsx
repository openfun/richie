import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { PropsWithChildren, useMemo } from 'react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { faker } from '@faker-js/faker';
import queryString from 'query-string';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import {
  AddressFactory,
  CertificateOrderWithOneClickPaymentFactory,
  CertificateOrderWithPaymentFactory,
  CertificateProductFactory,
  CredentialOrderWithOneClickPaymentFactory,
  CredentialOrderWithPaymentFactory,
  CredentialProductFactory,
  CreditCardFactory,
  OrderGroupFactory,
  CourseLightFactory,
  EnrollmentFactory,
} from 'utils/test/factories/joanie';
import { PAYMENT_SETTINGS } from 'settings';
import type * as Joanie from 'types/Joanie';
import {
  OrderCredentialCreationPayload,
  OrderState,
  ProductType,
  OrderGroup,
  CertificateProduct,
  CredentialProduct,
} from 'types/Joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { Maybe } from 'types/utils';
import { noop } from 'utils';
import {
  SaleTunnelContextType,
  SaleTunnelContext,
  SaleTunnelCredentialContext,
  SaleTunnelCertificateContext,
} from 'components/SaleTunnel/context';
import { ObjectHelper } from 'utils/ObjectHelper';
import useProductOrder from 'hooks/useProductOrder';
import PaymentButton from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: {
      backend: 'fonzie',
      endpoint: 'https://authentication.test',
    },
    joanie_backend: {
      endpoint: 'https://joanie.test',
    },
    site_urls: {
      terms_and_conditions: '/en/about/terms-and-conditions/',
    },
  }).one(),
}));

jest.mock('./components/PaymentInterfaces');

type WrapperProps = PropsWithChildren<{
  client?: QueryClient;
  product: CredentialProduct | CertificateProduct;
  orderGroup?: OrderGroup;
}>;

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
  'PaymentButton for $productType product',
  ({ productType, ProductFactory, OrderWithOneClickPaymentFactory, OrderWithPaymentFactory }) => {
    let nbApiCalls: number;
    const TEST_COURSE_CODE = '00000';
    const TEST_ENROLLMENT_ID = faker.string.uuid();

    const formatPrice = (price: number, currency: string) =>
      new Intl.NumberFormat('en', {
        currency,
        style: 'currency',
      }).format(price);

    const SaleTunnelWrapper = ({
      product,
      orderGroup,
      children,
    }: Exclude<WrapperProps, 'client'>) => {
      const { item: order } = useProductOrder({
        courseCode: product.type === ProductType.CREDENTIAL ? TEST_COURSE_CODE : undefined,
        enrollmentId: product.type === ProductType.CERTIFICATE ? TEST_ENROLLMENT_ID : undefined,
        productId: product.id,
      });

      const context: SaleTunnelContextType = useMemo(() => {
        if (product.type === ProductType.CREDENTIAL) {
          return {
            product,
            order,
            key: `${TEST_COURSE_CODE}+${product.id}`,
            course: CourseLightFactory({ code: TEST_COURSE_CODE }).one(),
            orderGroup,
          } as SaleTunnelCredentialContext;
        } else {
          return {
            product,
            order,
            key: `${TEST_ENROLLMENT_ID}+${product.id}`,
            enrollment: EnrollmentFactory({ id: TEST_ENROLLMENT_ID }).one(),
            orderGroup,
          } as SaleTunnelCertificateContext;
        }
      }, [product, order, orderGroup]);

      return <SaleTunnelContext.Provider value={context}>{children}</SaleTunnelContext.Provider>;
    };

    const Wrapper = ({
      client = createTestQueryClient({ user: true }),
      ...props
    }: WrapperProps) => {
      return (
        <IntlProvider locale="en">
          <QueryClientProvider client={client}>
            <JoanieSessionProvider>
              <SaleTunnelWrapper {...props} />
            </JoanieSessionProvider>
          </QueryClientProvider>
        </IntlProvider>
      );
    };

    beforeEach(() => {
      jest.useFakeTimers();
      jest.clearAllTimers();
      jest.resetAllMocks();

      fetchMock.restore();
      sessionStorage.clear();

      // Joanie providers calls
      fetchMock.get('https://joanie.test/api/v1.0/orders/', []);
      fetchMock.get('https://joanie.test/api/v1.0/credit-cards/', []);
      fetchMock.get('https://joanie.test/api/v1.0/addresses/', []);
      nbApiCalls = 3;
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      cleanup();
    });

    it('should render a payment button', async () => {
      const product: Joanie.Product = ProductFactory().one();
      const fetchOrderQueryParams =
        product.type === ProductType.CREDENTIAL
          ? {
              course_code: TEST_COURSE_CODE,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            }
          : {
              enrollment_id: TEST_ENROLLMENT_ID,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            };

      fetchMock.get(
        `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
        [],
      );

      render(
        <Wrapper product={product}>
          <PaymentButton onSuccess={jest.fn()} />
        </Wrapper>,
      );

      const $terms = screen.getByLabelText(
        'By checking this box, you accept the General Terms of Sale',
      );
      await act(async () => {
        fireEvent.click($terms);
      });

      const $button = screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // a billing address is missing, but the button stays enabled
      // this allows the user to get feedback on what's missing to make the payment by clicking on the button
      expect($button.disabled).toBe(false);

      // clicking the button should show an error and focus it so that screen reader users know what's happening
      await act(async () => {
        fireEvent.click($button);
      });
      const $error = screen.getByText('You must have a billing address.');
      expect(document.activeElement).toBe($error);
    });

    it('should render a payment button with a specific label when a credit card is provided', () => {
      /*
      If a credit card is provided, it seems that the payment should be a one click,
      so the payment button label should mention this information.
    */
      const product: Joanie.Product = ProductFactory().one();
      const creditCard: Joanie.CreditCard = CreditCardFactory().one();

      const fetchOrderQueryParams =
        product.type === ProductType.CREDENTIAL
          ? {
              course_code: TEST_COURSE_CODE,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            }
          : {
              enrollment_id: TEST_ENROLLMENT_ID,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            };

      fetchMock.get(
        `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
        [],
      );

      const { rerender } = render(
        <Wrapper product={product}>
          <PaymentButton creditCard={creditCard.id} onSuccess={jest.fn()} />
        </Wrapper>,
      );

      const $button = screen.getByRole('button', {
        name: `Pay in one click ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // a billing address is missing, but the button stays enabled
      // this allows the user to get feedback on what's missing to make the payment by clicking on the button
      expect($button.disabled).toBe(false);

      const billingAddress: Joanie.Address = AddressFactory().one();

      rerender(
        <Wrapper product={product}>
          <PaymentButton
            billingAddress={billingAddress}
            creditCard={creditCard.id}
            onSuccess={jest.fn()}
          />
        </Wrapper>,
      );

      // the button should be active
      expect($button.disabled).toBe(false);
    });

    it('should render an enabled payment button if a billing address is provided', () => {
      const product: Joanie.Product = ProductFactory().one();
      const billingAddress: Joanie.Address = AddressFactory().one();

      const fetchOrderQueryParams =
        product.type === ProductType.CREDENTIAL
          ? {
              course_code: TEST_COURSE_CODE,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            }
          : {
              enrollment_id: TEST_ENROLLMENT_ID,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            };

      fetchMock.get(
        `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
        [],
      );

      render(
        <Wrapper product={product}>
          <PaymentButton billingAddress={billingAddress} onSuccess={jest.fn()} />
        </Wrapper>,
      );

      const $button = screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // the button should be active
      expect($button.disabled).toBe(false);
    });

    it('should create an order then display the payment interface when user clicks on payment button', async () => {
      const product: Joanie.Product = ProductFactory().one();
      const billingAddress: Joanie.Address = AddressFactory().one();
      const handleSuccess = jest.fn();
      const { payment_info: paymentInfo, ...order } = OrderWithPaymentFactory().one();

      const fetchOrderQueryParams =
        product.type === ProductType.CREDENTIAL
          ? {
              course_code: TEST_COURSE_CODE,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            }
          : {
              enrollment_id: TEST_ENROLLMENT_ID,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            };

      fetchMock
        .get(
          `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
          [],
        )
        .post('https://joanie.test/api/v1.0/orders/', order)
        .patch(`https://joanie.test/api/v1.0/orders/${order.id}/submit/`, {
          paymentInfo,
        })
        .get(`https://joanie.test/api/v1.0/orders/${order.id}/`, {
          ...order,
        });

      render(
        <Wrapper client={createTestQueryClient({ user: true })} product={product}>
          <PaymentButton billingAddress={billingAddress} onSuccess={handleSuccess} />
        </Wrapper>,
      );
      nbApiCalls += 1; // useProductOrder call.
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);

      const $terms = screen.getByLabelText(
        'By checking this box, you accept the General Terms of Sale',
      );
      await act(async () => {
        fireEvent.click($terms);
      });

      const $button = screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // - Payment button should not be disabled.
      expect($button.disabled).toBe(false);

      // - User clicks on pay button
      await act(async () => {
        fireEvent.click($button);
      });

      // - Route to create order should have been called
      nbApiCalls += 1; // order post create (invalidate queries)
      nbApiCalls += 1; // useProductOrder call (invalidate from create)
      nbApiCalls += 1; // order submit (invalidate queries)
      nbApiCalls += 1; // useProductOrder call (invalidate from submit)

      await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));
      expect(fetchMock.lastUrl()).toBe(
        `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
      );

      // - Spinner should be displayed
      screen.getByText('Payment in progress');

      // - Payment interface should be displayed
      screen.getByText('Payment interface component');

      // - Simulate the payment has succeeded
      await act(async () => {
        fireEvent.click(screen.getByTestId('payment-success'));
      });

      // - Once payment succeeded, order should be refetch
      nbApiCalls += 1; // fetch validated order
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);
      expect(fetchMock.lastUrl()).toBe(`https://joanie.test/api/v1.0/orders/${order.id}/`);

      // - Order should be polled until its state is validated
      fetchMock.get(
        `https://joanie.test/api/v1.0/orders/${order.id}/`,
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
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);
      expect(fetchMock.lastUrl()).toBe(`https://joanie.test/api/v1.0/orders/${order.id}/`);

      // - As order state is validated, the onSuccess callback should be triggered.
      expect(handleSuccess).toHaveBeenCalledTimes(1);

      // - And poller should be stopped
      await act(async () => {
        jest.runOnlyPendingTimers();
      });
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);
    });

    it('should create an order only the first time the payment interface is shown, and not after aborting', async () => {
      const product: Joanie.Product = ProductFactory().one();
      const billingAddress: Joanie.Address = AddressFactory().one();
      const handleSuccess = jest.fn();
      const { payment_info: paymentInfo, ...order } = OrderWithPaymentFactory().one();

      const fetchOrderQueryParams =
        product.type === ProductType.CREDENTIAL
          ? {
              course_code: TEST_COURSE_CODE,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            }
          : {
              enrollment_id: TEST_ENROLLMENT_ID,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            };

      fetchMock
        .get(
          `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
          [],
        )
        .post('https://joanie.test/api/v1.0/orders/', order)
        .patch(`https://joanie.test/api/v1.0/orders/${order.id}/submit/`, {
          paymentInfo,
        })
        .get(`https://joanie.test/api/v1.0/orders/${order.id}/`, {
          ...order,
        })
        .post(`https://joanie.test/api/v1.0/orders/${order.id}/abort/`, HttpStatusCode.OK);

      render(
        <Wrapper client={createTestQueryClient({ user: true })} product={product}>
          <PaymentButton billingAddress={billingAddress} onSuccess={handleSuccess} />
        </Wrapper>,
      );
      nbApiCalls += 1; // useProductOrder call.
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);

      const $terms = screen.getByLabelText(
        'By checking this box, you accept the General Terms of Sale',
      );
      await act(async () => {
        fireEvent.click($terms);
      });

      const $button = screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // - Payment button should not be disabled.
      expect($button.disabled).toBe(false);

      // - User clicks on pay button
      await act(async () => {
        fireEvent.click($button);
      });

      // - Route to create order should have been called
      nbApiCalls += 1; // order post create (invalidate queries)
      nbApiCalls += 1; // useProductOrder call (invalidate from create)
      nbApiCalls += 1; // order submit (invalidate queries)
      nbApiCalls += 1; // useProductOrder call (invalidate from submit)

      await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));
      expect(fetchMock.lastUrl()).toBe(
        `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
      );

      // - Spinner should be displayed
      screen.getByText('Payment in progress');

      // - Payment interface should be displayed
      screen.getByText('Payment interface component');

      // - Simulate the payment aborting.
      fetchMock.get(
        `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
        [
          {
            ...order,
            state: OrderState.PENDING,
          },
        ],
        { overwriteRoutes: true },
      );
      await act(async () => {
        fireEvent.click(screen.getByTestId('payment-abort'));
      });

      nbApiCalls += 1; // abort order.
      nbApiCalls += 1; // useProductOrder call (invalidate from create)
      await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));
      expect(fetchMock.calls()[fetchMock.calls().length - 2][0]).toBe(
        `https://joanie.test/api/v1.0/orders/${order.id}/abort/`,
      );
      expect(fetchMock.calls()[fetchMock.calls().length - 1][0]).toBe(
        `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
      );

      screen.getByText('You have aborted the payment.');

      // screen.logTestingPlaygroundURL();

      // - User clicks on pay button again.
      await act(async () => {
        fireEvent.click($button);
      });

      // - Spinner should be displayed
      screen.getByText('Payment in progress');

      // - Payment interface should be displayed
      screen.getByText('Payment interface component');

      // - Now we make sure the order is not created again and just submitted.
      nbApiCalls += 1; // order submit (invalidate queries)
      nbApiCalls += 1; // useProductOrder call (invalidate from submit)

      await waitFor(() => expect(fetchMock.calls()).toHaveLength(nbApiCalls));
      expect(fetchMock.lastUrl()).toBe(
        `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
      );
    });

    it('should render a payment button and not call the order creation route', async () => {
      const product: Joanie.Product = ProductFactory().one();
      const billingAddress: Joanie.Address = AddressFactory().one();
      const creditCard: Joanie.CreditCard = CreditCardFactory().one();
      const { payment_info: paymentInfo, ...order } = OrderWithOneClickPaymentFactory().one();
      const handleSuccess = jest.fn();
      const initialOrder = {
        ...order,
        state: OrderState.PENDING,
      };
      const orderSubmitted = {
        ...order,
        state: OrderState.SUBMITTED,
      };

      const fetchOrderQueryParams =
        product.type === ProductType.CREDENTIAL
          ? {
              course_code: TEST_COURSE_CODE,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            }
          : {
              enrollment_id: TEST_ENROLLMENT_ID,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            };

      fetchMock
        .get(
          `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
          [initialOrder],
        )
        .post('https://joanie.test/api/v1.0/orders/', order)
        .patch(`https://joanie.test/api/v1.0/orders/${order.id}/submit/`, {
          payment_info: paymentInfo,
        })
        .get(`https://joanie.test/api/v1.0/orders/${order.id}/`, orderSubmitted);

      render(
        <Wrapper client={createTestQueryClient({ user: true })} product={product}>
          <PaymentButton
            billingAddress={billingAddress}
            creditCard={creditCard.id}
            onSuccess={handleSuccess}
          />
        </Wrapper>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('payment-button-order-loaded')).toBeInTheDocument();
      });

      const $terms = screen.getByLabelText(
        'By checking this box, you accept the General Terms of Sale',
      );
      await act(async () => {
        fireEvent.click($terms);
      });

      nbApiCalls += 1; // useProductOrder get order with filters
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);
      const $button = screen.getByRole('button', {
        name: `Pay in one click ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // - Payment button should not be disabled.
      expect($button.disabled).toBe(false);

      // - User clicks on pay button
      fetchMock.get(
        `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
        [orderSubmitted],
        { overwriteRoutes: true },
      );
      await act(async () => {
        fireEvent.click($button);
      });

      // - In real world condition the success callback is immediately called for one click payments.
      // - but here we need to click manually.
      const $success = screen.getByTestId('payment-success');
      await act(async () => {
        fireEvent.click($success);
      });

      // - Route to submit an existing order
      // - Furthermore, as payment succeeded immediately, order should have been refetched
      nbApiCalls += 1; // order submit
      nbApiCalls += 1; // useProductOrder call (invalidate from submit)
      nbApiCalls += 1; // order get on id
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);

      const submitCall = fetchMock
        .calls()
        .find((call) => call[0] === `https://joanie.test/api/v1.0/orders/${order.id}/submit/`);
      expect(submitCall).not.toBeUndefined();
      expect(JSON.parse(submitCall![1]!.body as string)).toEqual({
        billing_address: ObjectHelper.omit(billingAddress, 'id', 'is_main'),
        credit_card_id: creditCard.id,
      });
      expect(fetchMock.lastUrl()).toBe(`https://joanie.test/api/v1.0/orders/${order.id}/`);

      // - Spinner should be displayed
      screen.getByText('Payment in progress');

      // - Order should be polled until its state is validated
      fetchMock.get(
        `https://joanie.test/api/v1.0/orders/${order.id}/`,
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
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);
      expect(fetchMock.lastUrl()).toBe(`https://joanie.test/api/v1.0/orders/${order.id}/`);

      // - As order state is validated, the onSuccess callback should be triggered.
      expect(handleSuccess).toHaveBeenCalledTimes(1);
      // - And poller should be stopped
      await act(async () => {
        jest.runOnlyPendingTimers();
      });
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);
    });

    it('should abort the order if payment does not succeed after a given delay', async () => {
      const product: Joanie.Product = ProductFactory().one();
      const billingAddress: Joanie.Address = AddressFactory().one();
      const creditCard: Joanie.CreditCard = CreditCardFactory().one();
      const { payment_info: paymentInfo, ...order } = OrderWithOneClickPaymentFactory().one();
      const orderSubmitted = {
        ...order,
        state: OrderState.SUBMITTED,
      };
      const handleSuccess = jest.fn();

      const fetchOrderQueryParams =
        product.type === ProductType.CREDENTIAL
          ? {
              course_code: TEST_COURSE_CODE,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            }
          : {
              enrollment_id: TEST_ENROLLMENT_ID,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            };

      fetchMock
        .get(
          `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
          [orderSubmitted],
        )
        .post('https://joanie.test/api/v1.0/orders/', order)
        .patch(`https://joanie.test/api/v1.0/orders/${order.id}/submit/`, {
          payment_info: paymentInfo,
        })
        .get(`https://joanie.test/api/v1.0/orders/${order.id}/`, orderSubmitted)
        .post(`https://joanie.test/api/v1.0/orders/${order.id}/abort/`, HttpStatusCode.OK);

      render(
        <Wrapper client={createTestQueryClient({ user: true })} product={product}>
          <PaymentButton
            billingAddress={billingAddress}
            creditCard={creditCard.id}
            onSuccess={handleSuccess}
          />
        </Wrapper>,
      );
      await waitFor(() => {
        expect(screen.getByTestId('payment-button-order-loaded')).toBeInTheDocument();
      });
      nbApiCalls += 1; // fetcher order for userProductOrder
      const apiCalls = fetchMock.calls().map((call) => call[0]);
      expect(apiCalls).toContain(
        `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
      );

      const $terms = screen.getByLabelText(
        'By checking this box, you accept the General Terms of Sale',
      );
      await act(async () => {
        fireEvent.click($terms);
      });

      const $button = screen.getByRole('button', {
        name: `Pay in one click ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // - Payment button should not be disabled.
      expect($button.disabled).toBe(false);

      // - User clicks on pay button
      await act(async () => {
        fireEvent.click($button);
      });

      // - In real world condition the success callback is immediately called for one click payments.
      // - but here we need to click manually.
      const $success = screen.getByTestId('payment-success');
      await act(async () => {
        fireEvent.click($success);
      });

      // - Route to create order should have been called
      // - Furthermore, as payment succeeded immediately, order should have been refetched
      const onClickApiCalls = fetchMock.calls().splice(nbApiCalls);
      nbApiCalls += 1; // order submit
      nbApiCalls += 1; // refetch order (submit invalidate)
      nbApiCalls += 1; // fetch validated order
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);

      expect(onClickApiCalls[0][0]).toBe(`https://joanie.test/api/v1.0/orders/${order.id}/submit/`);
      expect(JSON.parse(onClickApiCalls[0][1]!.body as string)).toEqual({
        billing_address: ObjectHelper.omit(billingAddress, 'id', 'is_main'),
        credit_card_id: creditCard.id,
      });
      expect(onClickApiCalls[1][0]).toBe(
        `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
      );
      expect(onClickApiCalls[2][0]).toBe(`https://joanie.test/api/v1.0/orders/${order.id}/`);

      // - Spinner should be displayed
      screen.getByText('Payment in progress');

      fetchMock.resetHistory();
      // - Wait until order has been polled 29 times.
      await jest.advanceTimersToNextTimerAsync(PAYMENT_SETTINGS.pollLimit);
      expect(fetchMock.calls()).toHaveLength(PAYMENT_SETTINGS.pollLimit - 1);

      // - This round should be the last after which the order should be aborted
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      await waitFor(
        async () => {
          // +1 is for useProductOrder call invalidation.
          expect(fetchMock.calls()).toHaveLength(PAYMENT_SETTINGS.pollLimit + 1);
          expect(fetchMock.calls()[fetchMock.calls().length - 2][0]).toBe(
            `https://joanie.test/api/v1.0/orders/${order.id}/abort/`,
          );
        },
        {
          timeout: 1100,
        },
      );

      expect(
        JSON.parse(fetchMock.calls()[fetchMock.calls().length - 2][1]!.body!.toString()),
      ).toEqual({
        payment_id: paymentInfo.payment_id,
      });

      // - An error message should be displayed and focused (for screen reader users)
      const $error = screen.getByText('An error occurred during payment. Please retry later.');
      expect(document.activeElement).toBe($error);
    }, 10000);

    it('should render an error message when payment failed', async () => {
      const product: Joanie.Product = ProductFactory().one();
      const billingAddress: Joanie.Address = AddressFactory().one();
      const { payment_info: paymentInfo, ...order } = OrderWithPaymentFactory().one();
      const handleSuccess = jest.fn();
      const fetchOrderQueryParams =
        product.type === ProductType.CREDENTIAL
          ? {
              course_code: TEST_COURSE_CODE,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            }
          : {
              enrollment_id: TEST_ENROLLMENT_ID,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            };

      fetchMock
        .get(
          `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
          [],
        )
        .post('https://joanie.test/api/v1.0/orders/', order)
        .patch(`https://joanie.test/api/v1.0/orders/${order.id}/submit/`, {
          payment_info: paymentInfo,
        })
        .get(`https://joanie.test/api/v1.0/orders/${order.id}/`, {
          ...order,
          state: OrderState.SUBMITTED,
        });

      render(
        <Wrapper client={createTestQueryClient({ user: true })} product={product}>
          <PaymentButton billingAddress={billingAddress} onSuccess={handleSuccess} />
        </Wrapper>,
      );
      nbApiCalls += 1; // useProductOrder get order with filters
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);

      const $terms = screen.getByLabelText(
        'By checking this box, you accept the General Terms of Sale',
      );
      await act(async () => {
        fireEvent.click($terms);
      });

      const $button = screen.getByRole('button', {
        name: `Pay ${formatPrice(product.price, product.price_currency)}`,
      }) as HTMLButtonElement;

      // - As all information are provided, payment button should not be disabled.
      expect($button.disabled).toBe(false);

      // - User clicks on pay button
      await act(async () => {
        fireEvent.click($button);
      });

      // - Route to create order should have been called
      nbApiCalls += 1; // order post create (invalidate queries)
      nbApiCalls += 1; // refetch useProductOrder
      nbApiCalls += 1; // order submit
      nbApiCalls += 1; // refetch useProductOrder
      expect(fetchMock.calls()).toHaveLength(nbApiCalls);

      expect(fetchMock.lastUrl()).toBe(
        `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
      );

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

    it('should show an error if user does not accept the terms', async () => {
      const product: Joanie.Product = ProductFactory().one();
      const billingAddress: Joanie.Address = AddressFactory().one();

      const fetchOrderQueryParams =
        product.type === ProductType.CREDENTIAL
          ? {
              course_code: TEST_COURSE_CODE,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            }
          : {
              enrollment_id: TEST_ENROLLMENT_ID,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            };

      fetchMock.get(
        `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
        [],
      );

      render(
        <Wrapper client={createTestQueryClient({ user: true })} product={product}>
          <PaymentButton billingAddress={billingAddress} onSuccess={noop} />
        </Wrapper>,
      );

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
      const product: Joanie.Product = ProductFactory().one();
      const billingAddress: Joanie.Address = AddressFactory().one();

      const fetchOrderQueryParams =
        product.type === ProductType.CREDENTIAL
          ? {
              course_code: TEST_COURSE_CODE,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            }
          : {
              enrollment_id: TEST_ENROLLMENT_ID,
              product_id: product.id,
              state: ['pending', 'validated', 'submitted'],
            };

      fetchMock.get(
        `https://joanie.test/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
        [],
      );

      render(
        <Wrapper client={createTestQueryClient({ user: true })} product={product}>
          <PaymentButton billingAddress={billingAddress} onSuccess={noop} />
        </Wrapper>,
      );

      const $terms = screen.getByRole('link', { name: 'General Terms of Sale' });
      expect($terms).toHaveAttribute('href', '/en/about/terms-and-conditions/');
    });

    if (productType === ProductType.CREDENTIAL) {
      it('should create an order with an order group', async () => {
        const product: Joanie.Product = ProductFactory().one();
        const orderGroup = OrderGroupFactory().one();
        const billingAddress: Joanie.Address = AddressFactory().one();
        const handleSuccess = jest.fn();

        let createOrderPayload: Maybe<OrderCredentialCreationPayload>;
        const { payment_info: paymentInfo, ...order } = OrderWithPaymentFactory().one();
        fetchMock
          .get(
            `https://joanie.test/api/v1.0/orders/?course_code=00000&product_id=${product.id}&state=pending&state=validated&state=submitted`,
            [],
          )
          .post('https://joanie.test/api/v1.0/orders/', (url, { body }) => {
            createOrderPayload = JSON.parse(body as any);
            return order;
          })
          .patch(`https://joanie.test/api/v1.0/orders/${order.id}/submit/`, {
            paymentInfo,
          })
          .get(`https://joanie.test/api/v1.0/orders/${order.id}/`, {
            ...order,
          });

        render(
          <Wrapper
            client={createTestQueryClient({ user: true })}
            product={product}
            orderGroup={orderGroup}
          >
            <PaymentButton billingAddress={billingAddress} onSuccess={handleSuccess} />
          </Wrapper>,
        );

        const $button = screen.getByRole('button', {
          name: `Pay ${formatPrice(product.price, product.price_currency)}`,
        }) as HTMLButtonElement;

        const $terms = screen.getByLabelText(
          'By checking this box, you accept the General Terms of Sale',
        );
        await act(async () => {
          fireEvent.click($terms);
        });

        // - Payment button should not be disabled.
        expect($button.disabled).toBe(false);

        // - User clicks on pay button
        await act(async () => {
          fireEvent.click($button);
        });

        await waitFor(() => expect(createOrderPayload?.order_group_id).toEqual(orderGroup.id));
      });
    }
  },
);
