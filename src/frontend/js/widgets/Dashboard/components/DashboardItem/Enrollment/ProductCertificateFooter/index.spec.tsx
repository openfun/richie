import { screen, waitForElementToBeRemoved } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import userEvent from '@testing-library/user-event';
import { CertificateProduct, CourseLight, OrderState, ProductType } from 'types/Joanie';
import {
  CourseStateFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import {
  CertificateFactory,
  CourseLightFactory,
  CourseRunFactory,
  OrderEnrollmentFactory,
  EnrollmentFactory,
  CertificateProductFactory,
} from 'utils/test/factories/joanie';
import { Priority } from 'types';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { PER_PAGE } from 'settings';
import { SaleTunnelProps } from 'components/SaleTunnel';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import ProductCertificateFooter from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));
jest.mock('components/SaleTunnel', () => ({
  __esModule: true,
  SaleTunnel: ({ isOpen, onFinish }: SaleTunnelProps) => {
    const React = require('react');
    const Factories = require('utils/test/factories/joanie');
    // Automatically call onFinish() callback after 100ms when the SaleTunnel is opened to simulate a payment.
    React.useEffect(() => {
      if (!isOpen) {
        return;
      }
      setTimeout(() => {
        const order = Factories.CertificateOrderWithOneClickPaymentFactory().one();
        onFinish?.(order);
      }, 100);
    }, [isOpen]);
    return <div data-testid="SaleTunnelMock" />;
  },
}));

describe('<ProductCertificateFooter/>', () => {
  let product: CertificateProduct;
  let course: CourseLight;
  setupJoanieSession();

  beforeEach(() => {
    product = CertificateProductFactory({ type: ProductType.CERTIFICATE }).one();
    course = CourseLightFactory().one();
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
        <ProductCertificateFooter
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
    ({ courseRunStateData }) => {
      render(
        <ProductCertificateFooter
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

  it('should display download button for a course run with certificate.', () => {
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
      'https://joanie.endpoint/api/v1.0/certificates/FAKE_CERTIFICATE_ID/',
      CertificateFactory({ id: order.certificate_id }).one(),
    );
    render(<ProductCertificateFooter product={product} enrollment={enrollment} />);
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
    expect(screen.queryByTestId('PurchaseButton__cta')).not.toBeInTheDocument();
  });

  it('should not display purchase button for a course run with submitted order.', () => {
    const order = OrderEnrollmentFactory({
      certificate_id: undefined,
      product_id: product.id,
      state: OrderState.SUBMITTED,
    }).one();
    const enrollment = EnrollmentFactory({
      orders: [order],
      course_run: CourseRunFactory({ course }).one(),
    }).one();
    render(<ProductCertificateFooter product={product} enrollment={enrollment} />);
    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('PurchaseButton__cta')).not.toBeInTheDocument();
  });

  it('should display purchase button for a course run with pending order.', () => {
    const order = OrderEnrollmentFactory({
      certificate_id: undefined,
      product_id: product.id,
      state: OrderState.PENDING,
    }).one();
    const enrollment = EnrollmentFactory({
      orders: [order],
      course_run: CourseRunFactory({ course }).one(),
    }).one();
    render(<ProductCertificateFooter product={product} enrollment={enrollment} />);
    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
    expect(screen.getByTestId('PurchaseButton__cta')).toBeInTheDocument();
  });

  it('should not display button (download or purchase) for a course run with order but without certificate.', () => {
    const order = OrderEnrollmentFactory({
      certificate_id: undefined,
      product_id: product.id,
    }).one();
    const enrollment = EnrollmentFactory({
      orders: [order],
      course_run: CourseRunFactory({ course }).one(),
    }).one();
    render(<ProductCertificateFooter product={product} enrollment={enrollment} />);
    expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('PurchaseButton__cta')).not.toBeInTheDocument();
  });

  // From https://github.com/openfun/richie/issues/2237
  it('should hide purchase button after payment', async () => {
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/?product_type=credential&state_exclude=canceled&page=1&page_size=${PER_PAGE.useOrdersEnrollments}`,
      {
        results: [],
        next: null,
        previous: null,
        count: 0,
      },
    );

    const enrollment = EnrollmentFactory({
      course_run: CourseRunFactory({
        state: CourseStateFactory({ priority: Priority.ONGOING_OPEN }).one(),
        course,
      }).one(),
    }).one();
    enrollment.product_relations[0].product = CertificateProductFactory().one();

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/enrollments/?was_created_by_order=false&is_active=true&page=1&page_size=${PER_PAGE.useOrdersEnrollments}`,
      {
        results: [enrollment],
        next: null,
        previous: null,
        count: 1,
      },
    );

    render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
      wrapper: BaseJoanieAppWrapper,
    });
    // <TestWrapper client={client} />);
    const user = userEvent.setup();
    await expectNoSpinner('Loading orders and enrollments...');
    await screen.findByRole('heading', {
      name: enrollment.course_run.course.title,
      level: 5,
    });

    // Click on the purchase button, memo: the SaleTunnel is mocked at the top of this file.
    const purchaseButton = screen.getByTestId('PurchaseButton__cta');
    await user.click(purchaseButton);

    // Then the onFinish() callback of the SaleTunnel is automatically called via the mock.
    await waitForElementToBeRemoved(screen.queryByTestId('PurchaseButton__cta'));
  });
});
