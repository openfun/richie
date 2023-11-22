import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { faker } from '@faker-js/faker';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { SessionProvider } from 'contexts/SessionContext';
import { DashboardTest } from 'widgets/Dashboard/components/DashboardTest';
import { CourseLight } from 'types/Joanie';
import {
  ContractDefinitionFactory,
  ContractFactory,
  CredentialOrderFactory,
  TargetCourseFactory,
} from 'utils/test/factories/joanie';
import { mockCourseProductWithOrder } from 'utils/test/mockCourseProductWithOrder';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { expectBannerError } from 'utils/test/expectBanner';
import { Deferred } from 'utils/test/deferred';
import { alert } from 'utils/indirection/window';
import { expectNoSpinner, expectSpinner } from 'utils/test/expectSpinner';
import { CONTRACT_SETTINGS } from 'settings';

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

jest.mock('utils/indirection/window', () => ({
  alert: jest.fn(() => true),
}));

describe('<DashboardItemOrder/> Contract', () => {
  const Wrapper = (route: string) => {
    return (
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <SessionProvider>
            <DashboardTest initialRoute={route} />
          </SessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  beforeAll(() => {
    const modalExclude = document.createElement('div');
    modalExclude.setAttribute('id', 'modal-exclude');
    document.body.appendChild(modalExclude);
  });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllTimers();

    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get(
      'begin:https://joanie.endpoint/api/v1.0/enrollments/',
      { results: [], next: null, previous: null, count: null },
      { overwriteRoutes: true },
    );
    fetchMock.get('https://joanie.endpoint/api/v1.0/me', []);
  });

  afterEach(() => {
    // jest.runOnlyPendingTimers();
    // jest.useRealTimers();
    jest.restoreAllMocks();
    jest.clearAllMocks();
    fetchMock.restore();
  });

  describe('non writable', () => {
    it('renders a non-writable order without contract attribute', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: null,
      }).one();

      fetchMock.get('begin:https://joanie.endpoint/api/v1.0/orders/', {
        results: [order],
        next: null,
        previous: null,
        count: null,
      });

      const { product } = mockCourseProductWithOrder(order);

      render(Wrapper(LearnerDashboardPaths.COURSES));

      await screen.findByRole('heading', { level: 5, name: product.title });

      expect(
        screen.queryByText('You have to sign this training contract to access your training.'),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
      expect(screen.getByText('On going')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 6, name: order.target_courses[0].title }),
      ).toBeInTheDocument();
      expect(screen.getByText('You are not enrolled in this course')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Enroll' })).toBeInTheDocument();
    });

    it('renders a non-writable order with a signed contract', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: ContractFactory({ signed_on: faker.date.past().toISOString() }).one(),
      }).one();

      fetchMock.get('begin:https://joanie.endpoint/api/v1.0/orders/', {
        results: [order],
        next: null,
        previous: null,
        count: null,
      });

      const { product } = mockCourseProductWithOrder(order);

      render(Wrapper(LearnerDashboardPaths.COURSES));

      await screen.findByRole('heading', { level: 5, name: product.title });

      expect(
        screen.queryByText('You have to sign this training contract to access your training.'),
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
      expect(screen.getByText('On going')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 6, name: order.target_courses[0].title }),
      ).toBeInTheDocument();
      expect(screen.getByText('You are not enrolled in this course')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Enroll' })).toBeInTheDocument();
    });

    it('renders a non-writable order with a contract not signed yet', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: ContractFactory({ signed_on: undefined }).one(),
      }).one();

      fetchMock.get('begin:https://joanie.endpoint/api/v1.0/orders/', {
        results: [order],
        next: null,
        previous: null,
        count: null,
      });

      const { product } = mockCourseProductWithOrder(order);

      render(Wrapper(LearnerDashboardPaths.COURSES));

      await screen.findByRole('heading', { level: 5, name: product.title });

      expect(screen.getByText('Ref. ' + (order.course as CourseLight).code)).toBeInTheDocument();
      expect(
        screen.getByText('You have to sign this training contract to access your training.'),
      ).toBeInTheDocument();
      expect(screen.getByText('Signature required')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Sign' })).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { level: 6, name: order.target_courses[0].title }),
      ).toBeInTheDocument();
      expect(screen.getByText('You are not enrolled in this course')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Enroll' })).not.toBeInTheDocument();
    });
  });

  describe('writable', () => {
    it('renders a writable order without contract', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: undefined,
      }).one();
      const { product } = mockCourseProductWithOrder(order);

      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/',
        { results: [order], next: null, previous: null, count: null },
        { overwriteRoutes: true },
      );

      render(Wrapper(LearnerDashboardPaths.ORDER.replace(':orderId', order.id)));
      expect(
        await screen.findByRole('heading', { level: 5, name: product.title }),
      ).toBeInTheDocument();

      expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
    });
    it('renders a writable order with a contract not signed yet', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: null,
      }).one();
      const { product } = mockCourseProductWithOrder(order);
      product.contract_definition = ContractDefinitionFactory().one();

      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/',
        { results: [order], next: null, previous: null, count: null },
        { overwriteRoutes: true },
      );

      render(Wrapper(LearnerDashboardPaths.ORDER.replace(':orderId', order.id)));
      expect(
        await screen.findByRole('heading', { level: 5, name: product.title }),
      ).toBeInTheDocument();

      expect(screen.getByText('Signature required')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign' })).toBeInTheDocument();
      expect(
        screen.getByText('You have to sign this training contract to access your training.'),
      ).toBeInTheDocument();

      expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
      expect(screen.queryByText(/You signed this training contract./)).not.toBeInTheDocument();

      const $enrollButtons = screen.getAllByRole('button', { name: 'Enroll' });
      expect($enrollButtons).toHaveLength(order.target_courses[0].course_runs.length);
      $enrollButtons.forEach(($button) => expect($button).toBeDisabled());

      await expectBannerError('You need to sign your contract before enrolling in a course run');
    });

    it('renders a writable order with a signed contract', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: ContractFactory({ signed_on: faker.date.past().toISOString() }).one(),
      }).one();
      const { product } = mockCourseProductWithOrder(order);

      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/',
        { results: [order], next: null, previous: null, count: null },
        { overwriteRoutes: true },
      );

      render(Wrapper(LearnerDashboardPaths.ORDER.replace(':orderId', order.id)));

      expect(
        await screen.findByRole('heading', { level: 5, name: product.title }),
      ).toBeInTheDocument();

      expect(screen.getByText('On going')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
      expect(
        screen.queryByText('You have to sign this training contract to access your training.'),
      ).not.toBeInTheDocument();

      expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
      expect(screen.getByText(/You signed this training contract./)).toBeInTheDocument();

      const $enrollButtons = screen.getAllByRole('button', { name: 'Enroll' });
      expect($enrollButtons).toHaveLength(order.target_courses[0].course_runs.length);
      $enrollButtons.forEach(($button) => expect($button).toBeEnabled());

      expect(
        screen.queryByText('You need to sign your contract before enrolling to your courses'),
      ).not.toBeInTheDocument();
    });

    it('fails signature submitting and displays an error', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: ContractFactory({ signed_on: undefined }).one(),
      }).one();
      const { product } = mockCourseProductWithOrder(order);

      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/',
        { results: [order], next: null, previous: null, count: null },
        { overwriteRoutes: true },
      );

      const submitDeferred = new Deferred();
      fetchMock.post(
        `https://joanie.endpoint/api/v1.0/orders/${order.id}/submit_for_signature/`,
        submitDeferred.promise,
      );

      // delay: null is needed because as we are using fake timers it would mock the timers of
      // RTL too. See https://github.com/testing-library/user-event/issues/833.
      const user = userEvent.setup({ delay: null });

      render(Wrapper(LearnerDashboardPaths.ORDER.replace(':orderId', order.id)));
      expect(
        await screen.findByRole('heading', { level: 5, name: product.title }),
      ).toBeInTheDocument();

      // The modal is not shown.
      expect(screen.queryByTestId('dashboard-contract-frame')).not.toBeInTheDocument();

      // Contract is shown and not in loading state.
      let contractElement = screen.getByTestId('dashboard-item-order-contract');
      expect(within(contractElement).queryByRole('status')).not.toBeInTheDocument();
      let signButton = screen.getByRole('button', { name: 'Sign' });
      expect(signButton).not.toHaveAttribute('disabled');

      await user.click(signButton);

      // Modal is opened.
      const modal = screen.getByTestId('dashboard-contract-frame');

      // Waiting for submit route.
      within(modal).queryByRole('header', { name: 'Loading your contract ...' });
      within(modal).queryByRole('status');

      // Resolve submit request.
      await act(async () => {
        submitDeferred.resolve(500);
      });

      // An error message is displayed.
      await expectBannerError(
        'An error happened while creating the contract. Please retry later.',
        modal,
      );

      // Close modal.
      const closeButton = screen.getByRole('button', { name: 'Close dialog' });
      await user.click(closeButton);
      expect(screen.queryByTestId('dashboard-contract-frame')).not.toBeInTheDocument();

      // Contract is still shown and not in loading state.
      contractElement = screen.getByTestId('dashboard-item-order-contract');
      expect(within(contractElement).queryByRole('status')).not.toBeInTheDocument();
      signButton = screen.getByRole('button', { name: 'Sign' });
      expect(signButton).not.toHaveAttribute('disabled');
    });

    it('succeed signature submitting but fails during polling', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: ContractFactory({ signed_on: undefined }).one(),
      }).one();
      const { product } = mockCourseProductWithOrder(order);

      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/',
        { results: [order], next: null, previous: null, count: null },
        { overwriteRoutes: true },
      );

      const submitDeferred = new Deferred();
      fetchMock.post(
        `https://joanie.endpoint/api/v1.0/orders/${order.id}/submit_for_signature/`,
        submitDeferred.promise,
      );

      // delay: null is needed because as we are using fake timers it would mock the timers of
      // RTL too. See https://github.com/testing-library/user-event/issues/833.
      const user = userEvent.setup({ delay: null });

      render(Wrapper(LearnerDashboardPaths.ORDER.replace(':orderId', order.id)));
      expect(
        await screen.findByRole('heading', { level: 5, name: product.title }),
      ).toBeInTheDocument();

      // The modal is not shown.
      expect(screen.queryByTestId('dashboard-contract-frame')).not.toBeInTheDocument();

      // Contract is shown and not in loading state.
      let contractElement = screen.getByTestId('dashboard-item-order-contract');
      expect(within(contractElement).queryByRole('status')).not.toBeInTheDocument();
      let signButton = screen.getByRole('button', { name: 'Sign' });
      expect(signButton).not.toHaveAttribute('disabled');

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
        jest.runOnlyPendingTimers();
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
        jest.runOnlyPendingTimers();
      });

      // We update the orders mock in order to return a signed contract before resolving the polling.
      const signedOrderDeferred = new Deferred();
      fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', signedOrderDeferred.promise, {
        overwriteRoutes: true,
      });

      // Resolve the second request.
      await act(async () => {
        orderDeferredSecond.resolve(500);
      });

      // An error message is displayed.
      await expectBannerError(
        'An error happened while fetching the order. Please come back later.',
        modal,
      );

      // Close modal.
      const closeButton = screen.getByRole('button', { name: 'Close dialog' });
      await user.click(closeButton);
      expect(screen.queryByTestId('dashboard-contract-frame')).not.toBeInTheDocument();

      // Contract is still shown and not in loading state.
      contractElement = screen.getByTestId('dashboard-item-order-contract');
      expect(within(contractElement).queryByRole('status')).not.toBeInTheDocument();
      signButton = screen.getByRole('button', { name: 'Sign' });
      expect(signButton).not.toHaveAttribute('disabled');
    });

    it('succeed signature submitting but exceeds polling max attempts', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: ContractFactory({ signed_on: undefined }).one(),
      }).one();
      const { product } = mockCourseProductWithOrder(order);

      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/',
        { results: [order], next: null, previous: null, count: null },
        { overwriteRoutes: true },
      );

      const submitDeferred = new Deferred();
      fetchMock.post(
        `https://joanie.endpoint/api/v1.0/orders/${order.id}/submit_for_signature/`,
        submitDeferred.promise,
      );

      // delay: null is needed because as we are using fake timers it would mock the timers of
      // RTL too. See https://github.com/testing-library/user-event/issues/833.
      const user = userEvent.setup({ delay: null });

      render(Wrapper(LearnerDashboardPaths.ORDER.replace(':orderId', order.id)));
      expect(
        await screen.findByRole('heading', { level: 5, name: product.title }),
      ).toBeInTheDocument();

      // The modal is not shown.
      expect(screen.queryByTestId('dashboard-contract-frame')).not.toBeInTheDocument();

      // Contract is shown and not in loading state.
      let contractElement = screen.getByTestId('dashboard-item-order-contract');
      expect(within(contractElement).queryByRole('status')).not.toBeInTheDocument();
      let signButton = screen.getByRole('button', { name: 'Sign' });
      expect(signButton).not.toHaveAttribute('disabled');

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
      const orderUrl = `https://joanie.endpoint/api/v1.0/orders/${order.id}/`;
      fetchMock.get(orderUrl, order);

      expect(fetchMock.calls(orderUrl).length).toBe(0);

      // Polling starts and succeeds after the second call.
      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      // Polling starts.
      await within(modal).findByRole('heading', { name: 'Verifying signature ...' });
      within(modal).queryByRole('status');

      // Verify that it tries MAX_ATTEMPTS times to request before showing the error.
      const MAX_ATTEMPTS = 30;
      for (let i = 1; i <= MAX_ATTEMPTS; i++) {
        // Verify the route has been called i times.
        expect(fetchMock.calls(orderUrl).length).toBe(i);

        // The polling loading message is shown.
        // eslint-disable-next-line no-await-in-loop
        await within(modal).findByRole('heading', { name: 'Verifying signature ...' });
        within(modal).queryByRole('status');

        // Expect the error is not shown.
        expect(
          screen.queryByText(
            'The signature is taking more time than expected ... please come back later.',
          ),
        ).not.toBeInTheDocument();

        // Advance timers to fast-forward the next poll request.
        // eslint-disable-next-line no-await-in-loop
        await act(async () => {
          jest.runOnlyPendingTimers();
        });
      }

      // Verify two times that no more calls are made.
      await act(async () => {
        jest.runOnlyPendingTimers();
      });
      expect(fetchMock.calls(orderUrl).length).toBe(30);

      await act(async () => {
        jest.runOnlyPendingTimers();
      });
      expect(fetchMock.calls(orderUrl).length).toBe(30);

      // Displays the specific error.
      await expectBannerError(
        'The signature is taking more time than expected ... please come back later.',
        modal,
      );

      // Close modal.
      const closeButton = screen.getByRole('button', { name: 'Close dialog' });
      await user.click(closeButton);
      expect(screen.queryByTestId('dashboard-contract-frame')).not.toBeInTheDocument();

      // Contract is still shown and not in loading state.
      contractElement = screen.getByTestId('dashboard-item-order-contract');
      expect(within(contractElement).queryByRole('status')).not.toBeInTheDocument();
      signButton = screen.getByRole('button', { name: 'Sign' });
      expect(signButton).not.toHaveAttribute('disabled');
    });

    it('successfully sign a contract', async () => {
      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: ContractFactory({ signed_on: undefined }).one(),
      }).one();
      const { product } = mockCourseProductWithOrder(order);

      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/',
        { results: [order], next: null, previous: null, count: null },
        { overwriteRoutes: true },
      );
      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/?page=1&page_size=50&product_type=credential',
        { results: [order], next: null, previous: null, count: null },
        { overwriteRoutes: true },
      );

      const submitDeferred = new Deferred();
      fetchMock.post(
        `https://joanie.endpoint/api/v1.0/orders/${order.id}/submit_for_signature/`,
        submitDeferred.promise,
      );

      // delay: null is needed because as we are using fake timers it would mock the timers of
      // RTL too. See https://github.com/testing-library/user-event/issues/833.
      const user = userEvent.setup({ delay: null });

      render(Wrapper(LearnerDashboardPaths.COURSES));

      await expectNoSpinner('Loading orders and enrollments...');

      expect(
        await screen.findByRole('heading', { level: 5, name: product.title }),
      ).toBeInTheDocument();

      // Make sure the sign button is shown.
      const $signButton = screen.getByRole('link', { name: 'Sign' });
      await user.click($signButton);

      // Contract is shown and not in loading state.
      let contractElement = screen.getByTestId('dashboard-item-order-contract');
      let signButton = screen.getByRole('button', { name: 'Sign' });
      expect(signButton).not.toHaveAttribute('disabled');

      // The modal is not shown.
      expect(screen.queryByTestId('dashboard-contract-frame')).not.toBeInTheDocument();

      await user.click(signButton);

      // Modal is opened.
      const modal = screen.getByTestId('dashboard-contract-frame');

      // Waiting for submit route.
      within(modal).queryByRole('header', { name: 'Loading your contract ...' });

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
            signed_on: new Date().toISOString(),
          },
        });
      });

      // We have the success message.
      await screen.findByRole('heading', { name: 'Congratulations!' });
      screen.getByText(
        'You will receive an email containing your signed contract. You can now enroll in your course runs!',
      );
      const nextButton = screen.getByRole('button', { name: 'Next' });

      // Next closes the modal.
      await user.click(nextButton);
      expect(screen.queryByTestId('dashboard-contract-frame')).not.toBeInTheDocument();

      // Contract is in loading state to prevent any interaction, waiting for order re-fetch.
      contractElement = screen.getByTestId('dashboard-item-order-contract');
      signButton = within(contractElement).getByRole('button', { name: 'Sign' });
      expect(signButton).toHaveAttribute('disabled');

      // Resolve the refresh order request.
      const signedOrder = {
        ...order,
        contract: {
          ...order.contract,
          signed_on: new Date().toISOString(),
        },
      };
      signedOrderDeferred.resolve({
        results: [signedOrder],
        next: null,
        previous: null,
        count: null,
      });

      // Contract signing is removed.
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument(),
      );

      // Go back to the list view to make sure the sign button is not shown anymore.
      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/?page=1&page_size=50&product_type=credential',
        { results: [signedOrder], next: null, previous: null, count: null },
        { overwriteRoutes: true },
      );

      const $backButton = screen.getByRole('link', { name: 'Back' });
      await user.click($backButton);

      await expectSpinner('Loading orders and enrollments...');
      await expectNoSpinner('Loading orders and enrollments...');

      expect(
        await screen.findByRole('heading', { level: 5, name: product.title }),
      ).toBeInTheDocument();

      // Make sure the sign button is not shown.
      expect(screen.queryByRole('link', { name: 'Sign' })).not.toBeInTheDocument();
    });

    it('downloads the contract', async () => {
      // eslint-disable-next-line compat/compat
      URL.createObjectURL = jest.fn((blob) => blob) as any;
      window.open = jest.fn();

      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: ContractFactory({ signed_on: faker.date.past().toISOString() }).one(),
      }).one();
      const { product } = mockCourseProductWithOrder(order);

      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/',
        { results: [order], next: null, previous: null, count: null },
        { overwriteRoutes: true },
      );

      const DOWNLOAD_URL = `https://joanie.endpoint/api/v1.0/contracts/${
        order.contract!.id
      }/download/`;
      fetchMock.get(DOWNLOAD_URL, 'contract content');

      render(Wrapper(LearnerDashboardPaths.ORDER.replace(':orderId', order.id)));

      // delay: null is needed because as we are using fake timers it would mock the timers of
      // RTL too. See https://github.com/testing-library/user-event/issues/833.
      const user = userEvent.setup({ delay: null });

      expect(
        await screen.findByRole('heading', { level: 5, name: product.title }),
      ).toBeInTheDocument();

      // eslint-disable-next-line compat/compat
      expect(URL.createObjectURL).toHaveBeenCalledTimes(0);
      expect(window.open).toHaveBeenCalledTimes(0);
      expect(fetchMock.called(DOWNLOAD_URL)).toBe(false);

      // Click on download and make sure the following function have been called with response content.
      const downloadButton = screen.getByRole('button', { name: 'Download' });
      await user.click(downloadButton);

      expect(fetchMock.called(DOWNLOAD_URL)).toBe(true);
      // eslint-disable-next-line compat/compat
      expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
      // eslint-disable-next-line compat/compat
      expect(URL.createObjectURL).toHaveBeenCalledWith('contract content');
      expect(window.open).toHaveBeenCalledTimes(1);
      expect(window.open).toHaveBeenCalledWith('contract content');
    });

    it('fails downloading the contract and shows an error', async () => {
      // eslint-disable-next-line compat/compat
      URL.createObjectURL = jest.fn((blob) => blob) as any;
      window.open = jest.fn();

      const order = CredentialOrderFactory({
        target_courses: TargetCourseFactory().many(1),
        target_enrollments: [],
        contract: ContractFactory({ signed_on: faker.date.past().toISOString() }).one(),
      }).one();
      const { product } = mockCourseProductWithOrder(order);

      fetchMock.get(
        'https://joanie.endpoint/api/v1.0/orders/',
        { results: [order], next: null, previous: null, count: null },
        { overwriteRoutes: true },
      );

      const DOWNLOAD_URL = `https://joanie.endpoint/api/v1.0/contracts/${
        order.contract!.id
      }/download/`;
      fetchMock.get(DOWNLOAD_URL, 500);

      render(Wrapper(LearnerDashboardPaths.ORDER.replace(':orderId', order.id)));

      // delay: null is needed because as we are using fake timers it would mock the timers of
      // RTL too. See https://github.com/testing-library/user-event/issues/833.
      const user = userEvent.setup({ delay: null });

      expect(
        await screen.findByRole('heading', { level: 5, name: product.title }),
      ).toBeInTheDocument();

      expect(fetchMock.called(DOWNLOAD_URL)).toBe(false);
      // eslint-disable-next-line compat/compat
      expect(URL.createObjectURL).toHaveBeenCalledTimes(0);
      expect(window.open).toHaveBeenCalledTimes(0);
      expect(alert).toHaveBeenCalledTimes(0);

      // Click on download and make sure the following function have been called with response content.
      const downloadButton = screen.getByRole('button', { name: 'Download' });
      await user.click(downloadButton);

      expect(fetchMock.called(DOWNLOAD_URL)).toBe(true);
      // eslint-disable-next-line compat/compat
      expect(URL.createObjectURL).toHaveBeenCalledTimes(0);
      expect(window.open).toHaveBeenCalledTimes(0);

      expect(alert).toHaveBeenCalledTimes(1);
      expect(alert).toHaveBeenCalledWith(
        'An error happened while downloading the training contract. Please try again later.',
      );
    });
  });
});
