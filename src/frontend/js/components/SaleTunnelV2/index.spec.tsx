import { act, cleanup, screen } from '@testing-library/react';
import { faker } from '@faker-js/faker';
import fetchMock from 'fetch-mock';
import queryString from 'query-string';
import { ProductType } from 'types/Joanie';
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
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { render } from 'utils/test/render';
import { SaleTunnelV2, SaleTunnelV2Props } from 'components/SaleTunnelV2/index';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  matchMedia: () => ({
    matches: true,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }),
}));

jest.mock('../PaymentButton/components/PaymentInterfaces');

describe.each([
  {
    productType: ProductType.CREDENTIAL,
    ProductFactory: CredentialProductFactory,
    OrderWithOneClickPaymentFactory: CredentialOrderWithOneClickPaymentFactory,
    OrderWithPaymentFactory: CredentialOrderWithPaymentFactory,
  },
  // {
  //   productType: ProductType.CERTIFICATE,
  //   ProductFactory: CertificateProductFactory,
  //   OrderWithOneClickPaymentFactory: CertificateOrderWithOneClickPaymentFactory,
  //   OrderWithPaymentFactory: CertificateOrderWithPaymentFactory,
  // },
])(
  'SaleTunnel for $productType product',
  ({ productType, ProductFactory, OrderWithOneClickPaymentFactory, OrderWithPaymentFactory }) => {
    let nbApiCalls: number;

    setupJoanieSession();

    const course = CourseFactory().one();
    const enrollment =
      productType === ProductType.CERTIFICATE ? EnrollmentFactory().one() : undefined;

    const formatPrice = (price: number, currency: string) =>
      new Intl.NumberFormat('en', {
        currency,
        style: 'currency',
      }).format(price);

    const Wrapper = (props: Omit<SaleTunnelV2Props, 'isOpen' | 'onClose'>) => {
      return (
        <SaleTunnelV2
          {...props}
          enrollment={enrollment}
          course={course}
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
    });

    afterEach(() => {
      act(() => {
        jest.runOnlyPendingTimers();
      });
      jest.useRealTimers();
      cleanup();
    });

    // TODO: Migrate
    it('should render a payment button with a specific label when a credit card is provided', async () => {
      const product = ProductFactory().one();
      const creditCard = CreditCardFactory().one();
      const address = AddressFactory().one();

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

      fetchMock.get(`https://joanie.endpoint/api/v1.0/orders/`, []);
      fetchMock.get(
        `https://joanie.endpoint/api/v1.0/orders/?${queryString.stringify(fetchOrderQueryParams)}`,
        [],
      );
      fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', [address]);
      fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', [creditCard]);

      render(<Wrapper product={product} />);

      const $button = (await screen.findByRole('button', {
        name: `Pay in one click ${formatPrice(product.price, product.price_currency)}`,
      })) as HTMLButtonElement;

      // a billing address is missing, but the button stays enabled
      // this allows the user to get feedback on what's missing to make the payment by clicking on the button
      expect($button.disabled).toBe(false);
    });
  },
);
