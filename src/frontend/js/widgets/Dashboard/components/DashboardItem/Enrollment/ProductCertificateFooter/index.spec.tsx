import { IntlProvider } from 'react-intl';
import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import fetchMock from 'fetch-mock';
import { CourseLight, OrderState, Product, ProductType } from 'types/Joanie';
import {
  CourseStateFactory,
  UserFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import {
  CertificateFactory,
  CourseLightFactory,
  CourseRunFactory,
  OrderEnrollmentFactory,
  EnrollmentFactory,
  ProductFactory,
} from 'utils/test/factories/joanie';
import { Priority } from 'types';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import ProductCertificateFooter, { ProductCertificateFooterProps } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint.test' },
  }).one(),
}));

describe('<ProductCertificateFooter/>', () => {
  const Wrapper = ({ product, enrollment }: ProductCertificateFooterProps) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ user: UserFactory().one() })}>
        <JoanieSessionProvider>
          <ProductCertificateFooter product={product} enrollment={enrollment} />
        </JoanieSessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );
  let product: Product;
  let course: CourseLight;

  beforeAll(() => {
    // As dialog is rendered through a Portal, we have to add the DOM element in which the dialog will be rendered.
    const modalExclude = document.createElement('div');
    modalExclude.setAttribute('id', 'modal-exclude');
    document.body.appendChild(modalExclude);
  });

  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint.test/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint.test/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint.test/api/v1.0/orders/', []);

    product = ProductFactory({ type: ProductType.CERTIFICATE }).one();
    course = CourseLightFactory().one();
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it.each([
    {
      label: 'state: ONGOING_OPEN',
      courseRunStateData: { priority: Priority.ONGOING_OPEN },
    },
    {
      label: 'state: FUTURE_OPEN',
      courseRunStateData: { priority: Priority.FUTURE_OPEN },
    },
    {
      label: 'state: FUTURE_NOT_YET_OPEN',
      courseRunStateData: { priority: Priority.FUTURE_NOT_YET_OPEN },
    },
    {
      label: 'state: FUTURE_CLOSED',
      courseRunStateData: { priority: Priority.FUTURE_CLOSED },
    },
    {
      label: 'state: ONGOING_CLOSED',
      courseRunStateData: { priority: Priority.ONGOING_CLOSED },
    },
  ])(
    'should display purchase button for a open course run without order (state $courseRunStateData.priority).',
    async ({ courseRunStateData }) => {
      render(
        <Wrapper
          product={product}
          enrollment={EnrollmentFactory({
            course_run: CourseRunFactory({
              state: CourseStateFactory(courseRunStateData).one(),
              course,
            }).one(),
          }).one()}
        />,
      );
      expect(screen.getByTestId('PurchaseButton__cta')).toBeInTheDocument();
    },
  );

  it.each([
    {
      label: 'state: ARCHIVED_CLOSED',
      courseRunStateData: { priority: Priority.ARCHIVED_CLOSED },
    },
    {
      label: 'state: ARCHIVED_OPEN',
      courseRunStateData: { priority: Priority.ARCHIVED_OPEN },
    },
    {
      label: 'state: TO_BE_SCHEDULED',
      courseRunStateData: { priority: Priority.TO_BE_SCHEDULED },
    },
  ])(
    "shouldn't display purchase button for a closed course run without order (state $courseRunStateData.priority).",
    async ({ courseRunStateData }) => {
      render(
        <Wrapper
          product={product}
          enrollment={EnrollmentFactory({
            course_run: CourseRunFactory({
              state: CourseStateFactory(courseRunStateData).one(),
              course,
            }).one(),
          }).one()}
        />,
      );
      expect(screen.queryByTestId('PurchaseButton__cta')).not.toBeInTheDocument();
    },
  );

  it('should display download button for a course run with certificate.', async () => {
    const order = OrderEnrollmentFactory({
      certificate_id: 'FAKE_CERTIFICATE_ID',
      state: OrderState.VALIDATED,
      product_id: product.id,
    }).one();
    const enrollment = EnrollmentFactory({
      orders: [order],
      course_run: CourseRunFactory({ course }).one(),
    }).one();
    fetchMock.get(
      'https://joanie.endpoint.test/api/v1.0/certificates/FAKE_CERTIFICATE_ID/',
      CertificateFactory({ id: order.certificate_id }).one(),
    );
    render(<Wrapper product={product} enrollment={enrollment} />);
    expect(await screen.findByRole('button', { name: 'Download' })).toBeInTheDocument();
    expect(screen.queryByTestId('PurchaseButton__cta')).not.toBeInTheDocument();
  });

  it.each<ProductType>([ProductType.CERTIFICATE, ProductType.CREDENTIAL])(
    'should not display button (download or purchase) for a course run with order but without certificate (product type: "%s").',
    async ([productType]) => {
      product.type = productType as ProductType;
      const order = OrderEnrollmentFactory({ certificate_id: undefined }).one();
      const enrollment = EnrollmentFactory({
        orders: [order],
        course_run: CourseRunFactory({ course }).one(),
      }).one();
      render(<Wrapper product={product} enrollment={enrollment} />);
      expect(await screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
      expect(screen.queryByTestId('PurchaseButton__cta')).not.toBeInTheDocument();
    },
  );
});
