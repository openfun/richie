import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropsWithChildren } from 'react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';

import { ContractFactory, CredentialOrderFactory } from 'utils/test/factories/joanie';
import { expectBannerError } from 'utils/test/expectBanner';
import { Deferred } from 'utils/test/deferred';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { CONTRACT_SETTINGS } from 'settings';
import { ContractFrame } from '.';

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

jest.mock('settings', () => ({
  __esModule: true,
  ...jest.requireActual('settings'),
  CONTRACT_SETTINGS: { pollLimit: 3, dummySignatureSignTimeout: 2000 },
}));

describe('<DashboardItemOrder/> Contract', () => {
  const mockOnClose = jest.fn();
  const mockOnDone = jest.fn();
  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <JoanieSessionProvider>{children}</JoanieSessionProvider>
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

    // SessionProvider api calls
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', {
      results: [],
      next: null,
      previous: null,
      count: null,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('fails signature submitting and displays an error', async () => {
    const order = CredentialOrderFactory({
      contract: ContractFactory({ student_signed_on: undefined }).one(),
    }).one();

    const submitDeferred = new Deferred();
    fetchMock.post(
      `https://joanie.endpoint/api/v1.0/orders/${order.id}/submit_for_signature/`,
      submitDeferred.promise,
    );

    render(
      <Wrapper>
        <ContractFrame order={order} isOpen={true} onDone={mockOnDone} onClose={mockOnClose} />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(fetchMock.calls().map((call) => call[0])).toContain(
        `https://joanie.endpoint/api/v1.0/orders/${order.id}/submit_for_signature/`,
      );
    });

    await act(async () => {
      // Resolve useResourcesOmniscient filters's useEffect.
      jest.runOnlyPendingTimers();
    });

    // Waiting for submit route.
    expect(screen.getByRole('heading', { name: 'Loading your contract ...' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Resolve submit request.
    await act(async () => {
      submitDeferred.resolve(500);
    });

    // An error message is displayed.
    await expectBannerError('An error happened while creating the contract. Please retry later.');
  });

  it('succeed signature submitting but fails during polling', async () => {
    const order = CredentialOrderFactory({
      contract: ContractFactory({ student_signed_on: undefined }).one(),
    }).one();
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

    render(
      <Wrapper>
        <ContractFrame order={order} isOpen={true} onDone={mockOnDone} onClose={mockOnClose} />
      </Wrapper>,
    );

    await waitFor(() => {
      expect(fetchMock.calls().map((call) => call[0])).toContain(
        `https://joanie.endpoint/api/v1.0/orders/${order.id}/submit_for_signature/`,
      );
    });

    await act(async () => {
      // Resolve useResourcesOmniscient filters's useEffect.
      // JoanieSessionProvider query are "fetching === true"
      jest.runOnlyPendingTimers();
    });

    await act(async () => {
      // Resolve useResourcesOmniscient filters's useEffect.
      // JoanieSessionProvider query are "fetching === false"
      jest.runOnlyPendingTimers();
    });

    // Resolve submit request.
    await act(async () => {
      submitDeferred.resolve({
        invitation_link:
          'https://dummysignaturebackend.fr/?requestToken=wfl_fake_dummy_dbe038b3-b6fe-40f4-b5bb-101fc80047a6#requestId=req',
      });
    });

    // The contract is displayed.
    const contractSignButton = screen.getByRole('button', { name: 'Sign' });

    // Sign the contract.
    await user.click(contractSignButton);

    // Fake loading screen.
    expect(
      await screen.findByRole('heading', { name: 'Signing the contract ...' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

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

    expect(fetchMock.calls(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`).length).toBe(0);

    // Polling starts and succeeds after the second call.
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(fetchMock.calls(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`).length).toBe(1);
    expect(screen.getByRole('heading', { name: 'Verifying signature ...' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Resolve the first request.
    await act(async () => {
      orderDeferredFirst.resolve({
        ...order,
        contract: undefined,
      });
    });

    // Still displaying pending message.
    expect(screen.getByRole('heading', { name: 'Verifying signature ...' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Fast-forward the second polling request.
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    // Resolve the second request.
    await act(async () => {
      orderDeferredSecond.resolve(500);
    });

    // An error message is displayed.
    await expectBannerError('An error happened while fetching the order. Please come back later.');
  });

  it('succeed signature submitting but exceeds polling max attempts', async () => {
    const order = CredentialOrderFactory({
      contract: ContractFactory({ student_signed_on: undefined }).one(),
    }).one();
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

    render(
      <Wrapper>
        <ContractFrame order={order} isOpen={true} onDone={mockOnDone} onClose={mockOnClose} />
      </Wrapper>,
    );

    await act(async () => {
      // Resolve useResourcesOmniscient filters's useEffect.
      // JoanieSessionProvider query are "fetching === true"
      jest.runOnlyPendingTimers();
    });

    await act(async () => {
      // Resolve useResourcesOmniscient filters's useEffect.
      // JoanieSessionProvider query are "fetching === false"
      jest.runOnlyPendingTimers();
    });

    // Resolve submit request.
    await act(async () => {
      submitDeferred.resolve({
        invitation_link:
          'https://dummysignaturebackend.fr/?requestToken=wfl_fake_dummy_dbe038b3-b6fe-40f4-b5bb-101fc80047a6#requestId=req',
      });
    });

    // The contract is displayed.
    const contractSignButton = screen.getByRole('button', { name: 'Sign' });

    // Sign the contract.
    await user.click(contractSignButton);

    // Fake loading screen.
    expect(screen.getByRole('heading', { name: 'Signing the contract ...' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Mock polling request.
    const orderUrl = `https://joanie.endpoint/api/v1.0/orders/${order.id}/`;
    fetchMock.get(orderUrl, order);

    expect(fetchMock.calls(orderUrl).length).toBe(0);

    // Polling starts and succeeds after the second call.
    await act(async () => {
      jest.runOnlyPendingTimers();
    });

    // Polling starts.
    expect(screen.getByRole('heading', { name: 'Verifying signature ...' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Verify that it tries MAX_ATTEMPTS times to request before showing the error.
    for (let i = 1; i <= CONTRACT_SETTINGS.pollLimit; i++) {
      // Verify the route has been called i times.
      expect(fetchMock.calls(orderUrl).length).toBe(i);

      // The polling loading message is shown.
      // eslint-disable-next-line no-await-in-loop
      expect(screen.getByRole('heading', { name: 'Verifying signature ...' })).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();

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
    expect(fetchMock.calls(orderUrl).length).toBe(CONTRACT_SETTINGS.pollLimit);

    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(fetchMock.calls(orderUrl).length).toBe(CONTRACT_SETTINGS.pollLimit);

    // Displays the specific error.
    await expectBannerError(
      'The signature is taking more time than expected ... please come back later.',
    );
  });

  it('successfully sign a contract', async () => {
    const order = CredentialOrderFactory({
      contract: ContractFactory({ student_signed_on: undefined }).one(),
    }).one();
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

    render(
      <Wrapper>
        <ContractFrame order={order} isOpen={true} onDone={mockOnDone} onClose={mockOnClose} />
      </Wrapper>,
    );

    await act(async () => {
      // Resolve useResourcesOmniscient filters's useEffect.
      // JoanieSessionProvider query are "fetching === true"
      jest.runOnlyPendingTimers();
    });

    await act(async () => {
      // Resolve useResourcesOmniscient filters's useEffect.
      // JoanieSessionProvider query are "fetching === false"
      jest.runOnlyPendingTimers();
    });

    // Resolve submit request.
    await act(async () => {
      submitDeferred.resolve({
        invitation_link:
          'https://dummysignaturebackend.fr/?requestToken=wfl_fake_dummy_dbe038b3-b6fe-40f4-b5bb-101fc80047a6#requestId=req',
      });
    });

    // Sign the contract.
    await user.click(screen.getByRole('button', { name: 'Sign' }));

    // Fake loading screen.
    expect(screen.getByRole('heading', { name: 'Signing the contract ...' })).toBeInTheDocument();

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

    expect(fetchMock.calls(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`).length).toBe(0);

    // Polling starts and succeeds after the second call.
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    expect(screen.getByRole('heading', { name: 'Verifying signature ...' })).toBeInTheDocument();

    // Verify the route has been called.
    expect(fetchMock.calls(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`).length).toBe(1);

    // Resolve the first request.
    await act(async () => {
      orderDeferredFirst.resolve({
        ...order,
        contract: undefined,
      });
    });

    // Still displaying pending message.
    expect(screen.getByRole('heading', { name: 'Verifying signature ...' })).toBeInTheDocument();

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
      orderDeferredSecond.resolve({
        ...order,
        contract: {
          ...order.contract,
          student_signed_on: new Date().toISOString(),
        },
      });
    });

    expect(mockOnDone).toHaveBeenCalled();

    // We have the success message.
    expect(screen.getByRole('heading', { name: 'Congratulations!' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'You will receive an email containing your signed contract. You can now enroll in your course runs!',
      ),
    ).toBeInTheDocument();
    const $nextButton = screen.getByRole('button', { name: 'Next' });
    await user.click($nextButton);
    expect(mockOnClose).toHaveBeenCalled();
  });
});
