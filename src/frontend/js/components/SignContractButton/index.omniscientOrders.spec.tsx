import { PropsWithChildren } from 'react';
import { render, screen, within } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import fetchMock from 'fetch-mock';
import { ContractFactory, CredentialOrderFactory } from 'utils/test/factories/joanie';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { useOmniscientOrders } from 'hooks/useOrders';
import { CredentialOrder } from 'types/Joanie';
import { SessionProvider } from 'contexts/SessionContext';
import SignContractButton from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('settings', () => ({
  __esModule: true,
  ...jest.requireActual('settings'),
  CONTRACT_SETTINGS: { dummySignatureSignTimeout: 0 },
}));

describe('<SignContractButton/>', () => {
  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <SessionProvider>
            <MemoryRouter>{children}</MemoryRouter>
          </SessionProvider>
        </IntlProvider>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    // JoanieSession api omniscient calls
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('should hide sign button on learner training contract sign', async () => {
    const ApiOrdersWrapper = () => {
      const { items: orders } = useOmniscientOrders();
      return (
        orders[0] && (
          <SignContractButton
            order={orders[0] as CredentialOrder}
            contract={orders[0].contract}
            writable={true}
          />
        )
      );
    };
    const order = CredentialOrderFactory({
      contract: ContractFactory({ student_signed_on: undefined }).one(),
    }).one();
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/orders/',
      { results: [order], next: null, previous: null, count: null },
      { overwriteRoutes: true },
    );

    fetchMock.post(`https://joanie.endpoint/api/v1.0/orders/${order.id}/submit_for_signature/`, {
      invitation_link:
        'https://dummysignaturebackend.fr/?requestToken=wfl_fake_dummy_dbe038b3-b6fe-40f4-b5bb-101fc80047a6#requestId=req',
    });

    render(
      <Wrapper>
        <ApiOrdersWrapper />
      </Wrapper>,
    );

    expect(await screen.findByRole('button', { name: 'Sign' })).toBeInTheDocument();

    // The modal is not shown.
    expect(screen.queryByTestId('dashboard-contract-frame')).not.toBeInTheDocument();

    const user = userEvent.setup();
    const $openContractFrameButton = screen.getByRole('button', { name: 'Sign' });
    expect($openContractFrameButton).toBeEnabled();
    await user.click($openContractFrameButton);
    expect($openContractFrameButton).toBeDisabled();

    const signedOrder = {
      ...order,
      contract: {
        ...order.contract,
        student_signed_on: new Date().toISOString(),
      },
    };
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/orders/`,
      {
        results: [signedOrder],
        next: null,
        previous: null,
        count: 1,
      },
      { overwriteRoutes: true },
    );
    fetchMock.get(`https://joanie.endpoint/api/v1.0/orders/${order.id}/`, signedOrder, {
      overwriteRoutes: true,
    });
    const $modal = screen.getByTestId('dashboard-contract-frame');
    await user.click(await within($modal).findByRole('button', { name: 'Sign' }));

    // The final step should be displayed
    expect(
      await within($modal).findByRole('heading', { name: 'Congratulations!' }),
    ).toBeInTheDocument();
    // Orders's cache validation shouln't have close the ContractFrame.
    expect(screen.queryByTestId('dashboard-contract-frame')).toBeInTheDocument();

    // Close modal.
    const $closeButton = screen.getByRole('button', { name: 'Close dialog' });
    await user.click($closeButton);
    expect(screen.queryByTestId('dashboard-contract-frame')).not.toBeInTheDocument();

    expect(await screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument();
  });
});
