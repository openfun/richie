// FIXME: this test is about useUnionResource behavior.
// we need to rewrite it in useUnionResource tests suite as small and generic as possible.
import fetchMock from 'fetch-mock';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import {
  ContractFactory,
  CredentialOrderFactory,
  TargetCourseFactory,
} from 'utils/test/factories/joanie';
import { mockCourseProductWithOrder } from 'utils/test/mockCourseProductWithOrder';
import { Deferred } from 'utils/test/deferred';
import { expectNoSpinner, expectSpinner } from 'utils/test/expectSpinner';
import { CONTRACT_SETTINGS } from 'settings';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { BaseJoanieAppWrapper } from 'utils/test/wrappers/BaseJoanieAppWrapper';

import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: (props: any) => {
    (globalThis as any).__intersection_observer_props__ = props;
  },
}));

describe('<DashboardItemOrder/> Contract', () => {
  setupJoanieSession();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('writable', () => {
    it('successfully sign a contract', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: ContractFactory({ student_signed_on: undefined }).one(),
      }).one();

      // learner dashboard course page do one call to course product relation per order
      const { product } = mockCourseProductWithOrder(order);

      // overwrite useOmniscientOrders call
      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/',
        { results: [order], next: null, previous: null, count: 1 },
        { overwriteRoutes: true },
      );

      // mock useUnionResources calls
      fetchMock.get('begin:https://joanie.endpoint/api/v1.0/enrollments/', {
        results: [],
        next: null,
        previous: null,
        count: 0,
      });

      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/?product_type=credential&state_exclude=canceled&page=1&page_size=50',
        { results: [order], next: null, previous: null, count: 1 },
      );

      const submitDeferred = new Deferred();
      fetchMock.post(
        `https://joanie.endpoint/api/v1.0/orders/${order.id}/submit_for_signature/`,
        submitDeferred.promise,
      );

      // delay: null is needed because as we are using fake timers it would mock the timers of
      // RTL too. See https://github.com/testing-library/user-event/issues/833.
      const user = userEvent.setup({ delay: null });

      render(<DashboardTest initialRoute={LearnerDashboardPaths.COURSES} />, {
        wrapper: BaseJoanieAppWrapper,
      });

      await expectNoSpinner('Loading orders and enrollments...');

      expect(
        await screen.findByRole('heading', { level: 5, name: product.title }),
      ).toBeInTheDocument();

      // Make sure the sign button is shown.
      await user.click(screen.getByRole('link', { name: 'Sign' }));

      // Contract is shown and not in loading state.
      const contractElement = await screen.findByTestId(`dashboard-item-contract-${order.id}`);
      expect(within(contractElement).queryByRole('status')).not.toBeInTheDocument();
      const signButton = screen.getByRole('button', { name: 'Sign' });
      expect(signButton).not.toHaveAttribute('disabled');

      // The modal is not shown.
      expect(screen.queryByTestId('dashboard-contract-frame')).not.toBeInTheDocument();

      await user.click(signButton);

      // Modal is opened.
      const modal = screen.getByTestId('dashboard-contract-frame');

      // Waiting for submit route.
      within(modal).queryByRole('header', { name: 'Loading your contract ...' });
      within(modal).queryByRole('status');

      // Resolve submit request.
      await act(async () => {
        submitDeferred.resolve({
          invitation_link:
            'https://dummysignaturebackend.fr/?requestToken=wfl_fake_dummy_dbe038b3-b6fe-40f4-b5bb-101fc80047a6#requestId=req',
        });
      });

      // The contract is displayed.
      within(modal).queryByTestId('dummy-contract-placeholder');
      const contractSignButton = within(modal).getByRole('button', { name: 'Sign' });

      // Sign the contract.
      await user.click(contractSignButton);

      // Fake loading screen.
      within(modal).queryByRole('header', { name: 'Signing the contract ...' });
      within(modal).queryByRole('status');

      // Mock polling request.
      let calls = 0;
      const orderDeferredFirst = new Deferred();
      const orderDeferredSecond = new Deferred();
      fetchMock.get(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`, () => {
        calls++;
        if (calls === 1) {
          return orderDeferredFirst.promise;
        }
        return orderDeferredSecond.promise;
      });

      expect(fetchMock.calls(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`).length).toBe(
        0,
      );

      // Polling starts and succeeds after the second call.
      await act(async () => {
        // We prefer advanceTimersByTime over runOnlyPendingTimers, because the latter would trigger internal
        // react-query garbage collection, which is not what we want as we want to make sure the cache is well
        // handled by fetchEntity ( useUnionResources ) by verifying that isInvalidated is true. ( Otherwise we would
        // have got a undefined getQueryState(...) result. That's why we test that the "Sign" button from the
        // courses view is well removed.
        jest.advanceTimersByTime(CONTRACT_SETTINGS.pollInterval + 50);
      });
      await within(modal).findByRole('heading', { name: 'Verifying signature ...' });
      within(modal).queryByRole('status');

      // Verify the route has been called.
      expect(fetchMock.calls(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`).length).toBe(
        1,
      );

      // Resolve the first request.
      await act(async () => {
        orderDeferredFirst.resolve({
          ...order,
          contract: undefined,
        });
      });

      // Still displaying pending message.
      await within(modal).findByRole('heading', { name: 'Verifying signature ...' });
      within(modal).queryByRole('status');

      // Fast-forward the second polling request.
      await act(async () => {
        // We prefer advanceTimersByTime over runOnlyPendingTimers, because the latter would trigger internal
        // react-query garbage collection, which is not what we want as we want to make sure the cache is well
        // handled by fetchEntity ( useUnionResources ) by verifying that isInvalidated is true. ( Otherwise we would
        // have got a undefined getQueryState(...) result. That's why we test that the "Sign" button from the
        // courses view is well removed.
        jest.advanceTimersByTime(CONTRACT_SETTINGS.pollInterval + 50);
      });

      // We update the orders mock in order to return a signed contract before resolving the polling.
      const signedOrderDeferred = new Deferred();
      fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', signedOrderDeferred.promise, {
        overwriteRoutes: true,
      });

      // Resolve the second request.
      await act(async () => {
        orderDeferredSecond.resolve({
          ...order,
          contract: {
            ...order.contract,
            student_signed_on: new Date().toISOString(),
          },
        });
      });

      // We have the success message.
      await screen.findByRole('heading', { name: 'Congratulations!' });
      screen.getByText(
        'You will receive an email once your contract will be fully signed. You can now enroll in your course runs!',
      );
      const nextButton = screen.getByRole('button', { name: 'Next' });

      // Next closes the modal.
      await user.click(nextButton);

      // Contract sign button must prevent any interaction, waiting for order re-fetch.
      const orderDetailsSignButton = within(
        screen.getByTestId(`dashboard-item-contract-${order.id}`),
      ).getByRole('button', {
        name: 'Sign',
      });
      expect(orderDetailsSignButton).toHaveAttribute('disabled');

      // Resolve the refresh order request.
      const signedOrder = {
        ...order,
        contract: {
          ...order.contract,
          student_signed_on: new Date().toISOString(),
        },
      };
      signedOrderDeferred.resolve({
        results: [signedOrder],
        next: null,
        previous: null,
        count: 1,
      });

      // Contract signing is removed.
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument(),
      );

      // Go back to the list view to make sure the sign button is not shown anymore.
      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/?product_type=credential&state_exclude=canceled&page=1&page_size=50',
        { results: [signedOrder], next: null, previous: null, count: 1 },
        { overwriteRoutes: true },
      );

      const $backButton = screen.getByRole('link', { name: /Back/ });
      await user.click($backButton);

      await expectSpinner('Loading orders and enrollments...');
      await expectNoSpinner('Loading orders and enrollments...');

      expect(
        await screen.findByRole('heading', { level: 5, name: product.title }),
      ).toBeInTheDocument();

      // Make sure the sign button is not shown.
      expect(screen.queryByRole('link', { name: 'Sign' })).not.toBeInTheDocument();
    });
  });
});
