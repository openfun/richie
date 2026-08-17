import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { CredentialOrderFactory, CredentialProductFactory } from 'utils/test/factories/joanie';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import OrganizationBlock from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('../OrderWithdrawalModal', () => ({
  __esModule: true,
  OrderWithdrawalModal: ({
    isOpen,
    order,
    productTitle,
    reference,
  }: {
    isOpen: boolean;
    order: { id: string };
    productTitle: string;
    reference: string;
  }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="OrderWithdrawalModalMock">
        {order.id} - {productTitle} - {reference}
      </div>
    );
  },
}));

describe('<OrganizationBlock/>', () => {
  setupJoanieSession();
  const product = CredentialProductFactory({ contract_definition: undefined }).one();

  it('should display the withdrawal block with the withdraw button when the order is eligible', () => {
    const order = CredentialOrderFactory({
      total: 0,
      eligible_to_withdraw: true,
      withdrawal_date_limit: '2026-08-30T10:00:00.000Z',
      withdrawn_confirmation_at: null,
    }).one();

    render(<OrganizationBlock order={order} product={product} />);

    const block = screen.getByTestId('dashboard-item-withdrawal');
    within(block).getByRole('button', { name: 'Withdraw' });
    within(block).getByText('Aug 30, 2026', { exact: false });
    expect(screen.queryByTestId('dashboard-item-withdrawn')).not.toBeInTheDocument();
  });

  it('should not display any withdrawal information when the order is not eligible and has not been withdrawn', () => {
    const order = CredentialOrderFactory({
      total: 0,
      eligible_to_withdraw: false,
      withdrawn_confirmation_at: null,
    }).one();

    render(<OrganizationBlock order={order} product={product} />);

    expect(screen.queryByTestId('dashboard-item-withdrawal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('dashboard-item-withdrawn')).not.toBeInTheDocument();
  });

  it('should display the withdrawn status instead of the withdrawal block once the order has been withdrawn', () => {
    const order = CredentialOrderFactory({
      total: 0,
      eligible_to_withdraw: false,
      withdrawn_confirmation_at: '2026-08-10T10:00:00.000Z',
    }).one();

    render(<OrganizationBlock order={order} product={product} />);

    const block = screen.getByTestId('dashboard-item-withdrawn');
    within(block).getByText('Aug 10, 2026', { exact: false });
    expect(screen.queryByTestId('dashboard-item-withdrawal')).not.toBeInTheDocument();
  });

  it('should open the withdrawal modal with the order reference and product title when clicking the withdraw button', async () => {
    const order = CredentialOrderFactory({
      total: 0,
      eligible_to_withdraw: true,
      withdrawn_confirmation_at: null,
    }).one();

    render(<OrganizationBlock order={order} product={product} />);

    expect(screen.queryByTestId('OrderWithdrawalModalMock')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Withdraw' }));

    within(screen.getByTestId('OrderWithdrawalModalMock')).getByText(
      `${order.id} - ${product.title} - ${order.course.code}`,
    );
  });
});
