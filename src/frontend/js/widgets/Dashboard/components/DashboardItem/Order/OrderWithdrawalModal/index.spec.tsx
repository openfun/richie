import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fetchMock from 'fetch-mock';
import { OrderState } from 'types/Joanie';
import {
  UserFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import { CredentialOrderFactory, CertificateOrderFactory } from 'utils/test/factories/joanie';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { OrderWithdrawalModal } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

const mockMessageModal = jest.fn();
jest.mock('@openfun/cunningham-react', () => ({
  ...jest.requireActual('@openfun/cunningham-react'),
  useModals: () => ({
    messageModal: mockMessageModal,
  }),
}));

describe('<OrderWithdrawalModal/>', () => {
  setupJoanieSession();
  const user = UserFactory().one();
  const renderModal = (
    props: Partial<React.ComponentProps<typeof OrderWithdrawalModal>>,
    sessionUser = user,
  ) =>
    render(
      <OrderWithdrawalModal
        isOpen
        onClose={jest.fn()}
        order={CredentialOrderFactory().one()}
        productTitle="Some product"
        reference="COURSE-CODE"
        {...props}
      />,
      { queryOptions: { client: createTestQueryClient({ user: sessionUser }) } },
    );

  it('should display order and user information, without the account update link for a non-keycloak backend', () => {
    const order = CredentialOrderFactory().one();

    renderModal({ order });

    expect(
      screen.getByText('You wish to cancel your subscription to', { exact: false }),
    ).toBeInTheDocument();
    expect(screen.getByText('Account name')).toBeInTheDocument();
    expect(screen.getByText(user.full_name!)).toBeInTheDocument();
    expect(screen.getByText('Account email')).toBeInTheDocument();
    expect(screen.getByText(user.email!)).toBeInTheDocument();
    expect(screen.getByText('Order reference')).toBeInTheDocument();
    expect(screen.getByText(order.id)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'please update your account' }),
    ).not.toBeInTheDocument();
  });

  it('should confirm the withdrawal and display a confirmed message when the order is directly canceled', async () => {
    const order = CredentialOrderFactory().one();
    const updatedOrder = { ...order, state: OrderState.CANCELED };
    fetchMock.post(`https://joanie.endpoint/api/v1.0/orders/${order.id}/withdraw/`, updatedOrder);
    const onClose = jest.fn();

    renderModal({ order, onClose });

    const submitButton = screen.getByTestId('order-withdrawal-modal-submit-button');
    await userEvent.click(submitButton);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(mockMessageModal).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Withdrawal confirmed',
        children: 'Your order has been canceled following your withdrawal request.',
      }),
    );
  });

  it('should confirm the withdrawal and display a pending message when the order needs manual review', async () => {
    const order = CertificateOrderFactory().one();
    const updatedOrder = { ...order, state: OrderState.PENDING_WITHDRAW };
    fetchMock.post(`https://joanie.endpoint/api/v1.0/orders/${order.id}/withdraw/`, updatedOrder);
    const onSuccess = jest.fn();

    renderModal({ order, onSuccess });

    const submitButton = screen.getByTestId('order-withdrawal-modal-submit-button');
    await userEvent.click(submitButton);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(updatedOrder));
    expect(mockMessageModal).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Withdrawal request recorded',
        children: 'Your withdrawal request has been recorded and is being processed.',
      }),
    );
  });

  it('should display a specific error message when the withdrawal delay has expired', async () => {
    const order = CredentialOrderFactory().one();
    fetchMock.post(
      `https://joanie.endpoint/api/v1.0/orders/${order.id}/withdraw/`,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
    );
    const onClose = jest.fn();

    renderModal({ order, onClose });

    const submitButton = screen.getByTestId('order-withdrawal-modal-submit-button');
    await userEvent.click(submitButton);

    await screen.findByText('The withdrawal period for this order has expired.');
    expect(onClose).not.toHaveBeenCalled();
    expect(mockMessageModal).not.toHaveBeenCalled();
  });

  it('should display a generic error message for any other API error', async () => {
    const order = CredentialOrderFactory().one();
    fetchMock.post(
      `https://joanie.endpoint/api/v1.0/orders/${order.id}/withdraw/`,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
    const onClose = jest.fn();

    renderModal({ order, onClose });

    const submitButton = screen.getByTestId('order-withdrawal-modal-submit-button');
    await userEvent.click(submitButton);

    await screen.findByText('An error occurred, please contact our support team.');
    expect(onClose).not.toHaveBeenCalled();
    expect(mockMessageModal).not.toHaveBeenCalled();
  });
});
