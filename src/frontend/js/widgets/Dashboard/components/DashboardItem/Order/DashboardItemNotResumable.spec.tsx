/**
 * Test suite for DashboardItem component with a non-resumable order (inactive and related product
 * is no more purchasable (no remaining seats if order group, some target courses are not opened)).
 */

import fetchMock from 'fetch-mock';
import { render, screen, within } from '@testing-library/react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { CredentialOrderFactory } from 'utils/test/factories/joanie';
import { OrderState } from 'types/Joanie';
import { mockCourseProductWithOrder } from 'utils/test/mockCourseProductWithOrder';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('DashboardItemOrder / Not resumable', () => {
  setupJoanieSession();
  beforeEach(() => {
    fetchMock.get(
      'begin:https://joanie.endpoint/api/v1.0/enrollments/',
      { results: [], next: null, previous: null, count: null },
      { overwriteRoutes: true },
    );
  });
  afterEach(() => {
    fetchMock.restore();
  });

  describe('non-writable', () => {
    it('renders elements to explain that the order process is not resumable', async () => {
      const order = CredentialOrderFactory({
        state: OrderState.TO_SIGN,
      }).one();

      fetchMock.get('begin:https://joanie.endpoint/api/v1.0/orders/', {
        results: [order],
        next: null,
        previous: null,
        count: null,
      });

      const { product } = mockCourseProductWithOrder(order);
      // Make product no more purchasable
      product.remaining_order_count = 0;

      render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
        wrapper: BaseJoanieAppWrapper,
      });

      const dashboardItem = await screen.findByTestId(`dashboard-item-order-${order.id}`);
      within(dashboardItem).getByRole('heading', { level: 5, name: product.title });
      within(dashboardItem).getByText(
        'The subscription process cannot be resumed. The related training is no more purchasable.',
      );

      // No subitem should be displayed (target course details)
      expect(within(dashboardItem).queryAllByTestId('dashboard-sub-item')).toHaveLength(0);
    });
  });

  describe('writable', () => {
    it('renders elements to explain that the order process is not resumable', async () => {
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
      // Make product no more purchasable
      product.remaining_order_count = 0;

      render(
        <DashboardTest initialRoute={LearnerDashboardPaths.ORDER.replace(':orderId', order.id)} />,
        {
          wrapper: BaseJoanieAppWrapper,
        },
      );

      const dashboardItem = await screen.findByTestId(`dashboard-item-order-${order.id}`);
      within(dashboardItem).getByRole('heading', { level: 5, name: product.title });
      within(dashboardItem).getByText(
        'The subscription process cannot be resumed. The related training is no more purchasable.',
      );

      // No subitem should be displayed (target course details)
      expect(within(dashboardItem).queryAllByTestId('dashboard-sub-item')).toHaveLength(0);

      // Organization block should not be displayed
      expect(within(dashboardItem).queryByTestId('organization-block')).toBeNull();
    });
  });
});
