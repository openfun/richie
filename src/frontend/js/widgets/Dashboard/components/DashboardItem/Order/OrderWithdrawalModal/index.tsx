import {
  Alert,
  Button,
  Modal,
  ModalProps,
  ModalSize,
  useModals,
  VariantType,
} from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage, MessageDescriptor, useIntl } from 'react-intl';
import { ReactNode, useState } from 'react';
import { Order, OrderEnrollment, OrderState } from 'types/Joanie';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { useOrders } from 'hooks/useOrders';
import { useSession } from 'contexts/SessionContext';
import { UserHelper } from 'utils/UserHelper';
import { AuthenticationApi } from 'api/authentication';
import { APIBackend, KeycloakAccountApi } from 'types/api';
import context from 'utils/context';
import { Spinner } from 'components/Spinner';
import { HttpStatusCode, isHttpError } from 'utils/errors/HttpError';

const boldChunk = (chunks: ReactNode) => <strong>{chunks}</strong>;

const InfoRow = ({ label, value }: { label: MessageDescriptor; value: ReactNode }) => (
  <p className="mb-s">
    <span className="fw-bold">
      <FormattedMessage {...label} />
    </span>{' '}
    {value}
  </p>
);

const messages = defineMessages({
  title: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.title',
    defaultMessage: 'Withdrawal request',
    description: 'Title of the withdrawal request modal',
  },
  description: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.description',
    defaultMessage:
      'You wish to cancel your subscription to <bold>{productTitle} - Ref. {reference}</bold>.',
    description: 'Message displayed in the withdrawal request modal',
  },
  informationTitle: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.informationTitle',
    defaultMessage: 'Information',
    description: 'Title of the information recap section in the withdrawal request modal',
  },
  informationDescription: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.informationDescription',
    defaultMessage:
      'This information will be included in the acknowledgement of receipt for your request.',
    description: 'Description of the information recap section in the withdrawal request modal',
  },
  accountNameLabel: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.accountNameLabel',
    defaultMessage: 'Account name',
    description: 'Label for the account name in the withdrawal request modal',
  },
  accountEmailLabel: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.accountEmailLabel',
    defaultMessage: 'Account email',
    description: 'Label for the account email in the withdrawal request modal',
  },
  orderReferenceLabel: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.orderReferenceLabel',
    defaultMessage: 'Order reference',
    description: 'Label for the order reference in the withdrawal request modal',
  },
  accountLinkInfo: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.accountLinkInfo',
    defaultMessage: 'If any of the information above is incorrect,',
    description: 'Text before the account update link in the withdrawal request modal',
  },
  accountLinkLabel: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.accountLinkLabel',
    defaultMessage: 'please update your account',
    description: 'Label of the account update link in the withdrawal request modal',
  },
  submit: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.submit',
    defaultMessage: 'I confirm my withdrawal request',
    description: 'Submit button label of the withdrawal request modal',
  },
  submitInProgress: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.submitInProgress',
    defaultMessage: 'Withdrawal request in progress',
    description: 'Label for screen reader when a withdrawal request is in progress.',
  },
  successConfirmedTitle: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.successConfirmedTitle',
    defaultMessage: 'Withdrawal confirmed',
    description: 'Title of the success modal when the withdrawal is confirmed immediately',
  },
  successConfirmedDescription: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.successConfirmedDescription',
    defaultMessage: 'Your order has been canceled following your withdrawal request.',
    description: 'Description of the success modal when the withdrawal is confirmed immediately',
  },
  successPendingTitle: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.successPendingTitle',
    defaultMessage: 'Withdrawal request recorded',
    description: 'Title of the success modal when the withdrawal request needs manual review',
  },
  successPendingDescription: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.successPendingDescription',
    defaultMessage: 'Your withdrawal request has been recorded and is being processed.',
    description: 'Description of the success modal when the withdrawal request needs manual review',
  },
  errorDelayExpired: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.errorDelayExpired',
    defaultMessage: 'The withdrawal period for this order has expired.',
    description: 'Error message when the withdrawal delay has expired',
  },
  errorDefault: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.errorDefault',
    defaultMessage: 'An error occurred, please contact our support team.',
    description: 'Generic error message when the withdrawal request failed',
  },
});

interface Props extends Pick<ModalProps, 'isOpen' | 'onClose'> {
  order: Order | OrderEnrollment;
  productTitle: string;
  reference: string;
  /**
   * Called with the fresh order returned by the API once the withdrawal request succeeds.
   * Callers relying on locally held order state (rather than a query that gets invalidated)
   * must use this to update it, otherwise the UI keeps showing stale data until a full
   * page refresh.
   */
  onSuccess?: (order: Order) => void;
}

enum ComponentStates {
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error',
}

export const OrderWithdrawalModal = ({
  order,
  productTitle,
  reference,
  onSuccess,
  ...props
}: Props) => {
  const intl = useIntl();
  const API = useJoanieApi();
  const { user } = useSession();
  const { methods: orderMethods } = useOrders(undefined, { enabled: false });
  const modals = useModals();
  const [state, setState] = useState<ComponentStates>(ComponentStates.IDLE);
  const [error, setError] = useState<string>();

  const isKeycloakBackend = [APIBackend.KEYCLOAK, APIBackend.FONZIE_KEYCLOAK].includes(
    context?.authentication.backend as APIBackend,
  );

  const submit = async () => {
    setState(ComponentStates.LOADING);
    try {
      const updatedOrder = await API.user.orders.withdraw(order.id);
      await orderMethods.invalidate();
      onSuccess?.(updatedOrder);
      props.onClose();
      await modals.messageModal({
        messageType: VariantType.SUCCESS,
        title: intl.formatMessage(
          updatedOrder.state === OrderState.PENDING_WITHDRAW
            ? messages.successPendingTitle
            : messages.successConfirmedTitle,
        ),
        children: intl.formatMessage(
          updatedOrder.state === OrderState.PENDING_WITHDRAW
            ? messages.successPendingDescription
            : messages.successConfirmedDescription,
        ),
      });
    } catch (submitError) {
      setState(ComponentStates.ERROR);
      setError(
        intl.formatMessage(
          isHttpError(submitError) && submitError.code === HttpStatusCode.UNPROCESSABLE_ENTITY
            ? messages.errorDelayExpired
            : messages.errorDefault,
        ),
      );
    }
  };

  return (
    <Modal
      {...props}
      size={ModalSize.MEDIUM}
      title={intl.formatMessage(messages.title)}
      closeOnEsc={state !== ComponentStates.LOADING}
      preventClose={state === ComponentStates.LOADING}
      hideCloseButton={state === ComponentStates.LOADING}
      actions={
        <Button
          color="error"
          variant="primary"
          size="small"
          fullWidth={true}
          onClick={submit}
          disabled={state === ComponentStates.LOADING}
          data-testid="order-withdrawal-modal-submit-button"
        >
          {state === ComponentStates.LOADING ? (
            <Spinner theme="light" aria-labelledby="withdrawal-request-in-progress">
              <span id="withdrawal-request-in-progress">
                <FormattedMessage {...messages.submitInProgress} />
              </span>
            </Spinner>
          ) : (
            <FormattedMessage {...messages.submit} />
          )}
        </Button>
      }
    >
      {error && (
        <Alert type={VariantType.ERROR} className="mb-t">
          {error}
        </Alert>
      )}
      <p className="mb-b">
        <FormattedMessage
          {...messages.description}
          values={{
            productTitle,
            reference,
            bold: boldChunk,
          }}
        />
      </p>
      <h3 className="block-title mb-t">
        <FormattedMessage {...messages.informationTitle} />
      </h3>
      <p className="mb-s">
        <FormattedMessage {...messages.informationDescription} />
      </p>
      <InfoRow label={messages.accountNameLabel} value={user ? UserHelper.getName(user) : ''} />
      <InfoRow label={messages.accountEmailLabel} value={user?.email} />
      <InfoRow label={messages.orderReferenceLabel} value={order.id} />
      {isKeycloakBackend && (
        <p className="mb-b">
          <FormattedMessage {...messages.accountLinkInfo} />{' '}
          <a href={(AuthenticationApi!.account as KeycloakAccountApi).updateUrl()}>
            <FormattedMessage {...messages.accountLinkLabel} />
          </a>
          .
        </p>
      )}
    </Modal>
  );
};
