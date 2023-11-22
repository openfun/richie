import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropsWithChildren } from 'react';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { SessionProvider } from 'contexts/SessionContext';
import { CredentialOrderFactory } from 'utils/test/factories/joanie';
import { ContractFrame } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('<DashboardItemOrder/> Contract', () => {
  const Wrapper = ({ children }: PropsWithChildren) => {
    return (
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <IntlProvider locale="en">
          <SessionProvider>{children}</SessionProvider>
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
    // SessionProvider api calls
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('should render an ContractFrame and close it', async () => {
    const order = CredentialOrderFactory().one();
    fetchMock.post(`https://joanie.endpoint/api/v1.0/orders/${order.id}/submit_for_signature/`, {
      invitation_link:
        'https://dummysignaturebackend.fr/?requestToken=wfl_fake_dummy_dbe038b3-b6fe-40f4-b5bb-101fc80047a6#requestId=req',
    });

    const mockOnClose = jest.fn();
    render(
      <Wrapper>
        <ContractFrame order={order} isOpen={true} onDone={jest.fn()} onClose={mockOnClose} />
      </Wrapper>,
    );

    waitFor(() => {
      expect(fetchMock.calls().map((call) => call[0])).toContain(
        `https://joanie.endpoint/api/v1.0/orders/${order.id}/submit_for_signature/`,
      );
    });

    expect(await screen.findByTestId('dashboard-contract-frame')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not render the modal', async () => {
    const order = CredentialOrderFactory().one();
    fetchMock.post(`https://joanie.endpoint/api/v1.0/orders/${order.id}/submit_for_signature/`, {
      invitation_link: 'https://fake.link',
    });
    render(
      <Wrapper>
        <ContractFrame order={order} isOpen={false} onDone={jest.fn()} onClose={jest.fn()} />
      </Wrapper>,
    );

    waitFor(() => {
      expect(fetchMock.calls().map((call) => call[0])).toContain(
        `https://joanie.endpoint/api/v1.0/orders/${order.id}/submit_for_signature/`,
      );
    });

    expect(screen.queryByTestId('dashboard-contract-frame')).not.toBeInTheDocument();
  });
});
