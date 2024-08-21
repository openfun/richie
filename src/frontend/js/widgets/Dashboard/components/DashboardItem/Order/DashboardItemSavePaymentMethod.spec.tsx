/**
 * Test suite for DashboardItem component with an order in the state TO_SAVE_PAYMENT_METHOD.
 */
import fetchMock from 'fetch-mock';
import { screen } from '@testing-library/react';
import { within } from '@testing-library/dom';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { CredentialOrderFactory } from 'utils/test/factories/joanie';
import { OrderState } from 'types/Joanie';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';
import { mockCourseProductWithOrder } from 'utils/test/mockCourseProductWithOrder';
import { expectBannerError, expectNoBannerError } from 'utils/test/expectBanner';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('DashboardItem / (Save Payment Methode State)', () => {
  setupJoanieSession();
  beforeEach(() => {
    fetchMock.get(
      'begin:https://joanie.endpoint/api/v1.0/enrollments/',
      { results: [], next: null, previous: null, count: null },
      { overwriteRoutes: true },
    );
  });

  describe('non-writable', () => {
    it('renders elements to explain that a payment method is missing', async () => {
      const order = CredentialOrderFactory({
        state: OrderState.TO_SAVE_PAYMENT_METHOD,
      }).one();

      fetchMock.get('begin:https://joanie.endpoint/api/v1.0/orders/', {
        results: [order],
        next: null,
        previous: null,
        count: null,
      });

      const { product } = mockCourseProductWithOrder(order);

      render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
        wrapper: BaseJoanieAppWrapper,
      });

      const dashboardItem = await screen.findByTestId(`dashboard-item-order-${order.id}`);
      within(dashboardItem).getByRole('heading', { level: 5, name: product.title });
      within(dashboardItem).getByText('A payment method is missing');
      within(dashboardItem).getByText(
        'You must define a payment method to finalize your subscription.',
      );
      const link = within(dashboardItem).getByRole('link', { name: 'Define' });
      expect(link).toHaveAttribute('href', `/courses/orders/${order.id}`);
      await expectNoBannerError(
        'You have to define a payment method to finalize your subscription.',
      );
    });
  });

  describe('writable', () => {
    it('renders elements to explain that a payment method is missing', async () => {
      const order = CredentialOrderFactory({
        state: OrderState.TO_SAVE_PAYMENT_METHOD,
      }).one();

      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/',
        { results: [order], next: null, previous: null, count: null },
        { overwriteRoutes: true },
      );

      const url = `begin:https://joanie.endpoint/api/v1.0/orders/?`;
      fetchMock.get(url, [order]);

      const { product } = mockCourseProductWithOrder(order);

      render(
        <DashboardTest initialRoute={LearnerDashboardPaths.ORDER.replace(':orderId', order.id)} />,
        {
          wrapper: BaseJoanieAppWrapper,
        },
      );

      const dashboardItem = await screen.findByTestId(`dashboard-item-order-${order.id}`);
      within(dashboardItem).getByRole('heading', { level: 5, name: product.title });
      expect(
        within(dashboardItem).queryByText('A payment method is missing'),
      ).not.toBeInTheDocument();
      expect(within(dashboardItem).queryByRole('link', { name: 'Define' })).not.toBeInTheDocument();
      await expectBannerError('You have to define a payment method to finalize your subscription.');
      const link = screen.getByRole('link', { name: 'define a payment method' });
      expect(link).toHaveAttribute('href', '#dashboard-item-payment-method');

      // The payment block should display information about the missing payment method
      const paymentBlock = screen.getByTestId('dashboard-item-payment-method');
      const title = within(paymentBlock).getByText('Payment');
      expect(title.parentElement).toHaveClass('dashboard-splitted-card__item__title--dot');
      within(paymentBlock).getByText(
        'To finalize your subscription, you must define a payment method.',
      );
      within(paymentBlock).getByRole('button', { name: 'Define' });
    });
  });
});
