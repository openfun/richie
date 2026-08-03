import {
  Alert,
  Button,
  Modal,
  ModalProps,
  ModalSize,
  useModals,
  VariantType,
} from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useState } from 'react';
import { CertificateOrder, CredentialOrder, OrderEnrollment } from 'types/Joanie';
import { APIBackend, KeycloakAccountApi } from 'types/api';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { useSession } from 'contexts/SessionContext';
import { useOrders } from 'hooks/useOrders';
import { AuthenticationApi } from 'api/authentication';
import { UserHelper } from 'utils/UserHelper';
import { HttpError } from 'utils/errors/HttpError';
import { Spinner } from 'components/Spinner';
import context from 'utils/context';

const messages = defineMessages({
  title: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.title',
    description: 'Title of the withdrawal request modal',
    defaultMessage: 'Withdrawal request',
  },
  intro: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.intro',
    description: 'Introduction sentence of the withdrawal request modal',
    defaultMessage: 'You wish to cancel your subscription to {product}',
  },
  informationTitle: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.informationTitle',
    description: 'Title of the information section of the withdrawal request modal',
    defaultMessage: 'Information',
  },
  informationDescription: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.informationDescription',
    description: 'Description of the information section of the withdrawal request modal',
    defaultMessage:
      'This information will be included in the acknowledgement of receipt for your request.',
  },
  orderReferenceLabel: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.orderReferenceLabel',
    description: 'Label of the order reference field in the withdrawal request modal',
    defaultMessage: 'Order reference',
  },
  nameLabel: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.nameLabel',
    description: 'Label of the user name field in the withdrawal request modal',
    defaultMessage: 'Account name',
  },
  emailLabel: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.emailLabel',
    description: 'Label of the user email field in the withdrawal request modal',
    defaultMessage: 'Account email',
  },
  updateAccount: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.updateAccount',
    description: 'Sentence inviting the user to update their account if information is wrong',
    defaultMessage: 'If any of the information above is incorrect, please {link}.',
  },
  updateAccountLinkLabel: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.updateAccountLinkLabel',
    description: 'Label of the account update link',
    defaultMessage: 'update your account',
  },
  confirmButton: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.confirmButton',
    description: 'Label of the withdrawal confirmation button',
    defaultMessage: 'I confirm my withdrawal request',
  },
  confirmInProgress: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.confirmInProgress',
    description: 'Label for screen reader when the withdrawal request is in progress',
    defaultMessage: 'Withdrawal request in progress',
  },
  successTitle: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.successTitle',
    description: 'Title of the withdrawal success message',
    defaultMessage: 'Request recorded',
  },
  successDescription: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.successDescription',
    description: 'Description of the withdrawal success message',
    defaultMessage: 'Your request has been successfully recorded. A confirmation email has been sent.',
  },
  errorExpired: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.errorExpired',
    description: 'Error message displayed when the withdrawal period has expired',
    defaultMessage: 'The withdrawal period for this order has expired.',
  },
  errorGeneric: {
    id: 'components.DashboardItemOrder.OrderWithdrawalModal.errorGeneric',
    description: 'Generic error message displayed when the withdrawal request failed',
    defaultMessage: 'An error occured, please contact the support.',
  },
});

interface Props extends Pick<ModalProps, 'isOpen' | 'onClose'> {
  order: CredentialOrder | CertificateOrder | OrderEnrollment;
  productTitle: string;
  reference: string;
}

enum ComponentState {
  IDLE = 'idle',
  LOADING = 'loading',
  ERROR = 'error',
}

export const OrderWithdrawalModal = ({ order, productTitle, reference, ...props }: Props) => {
  const intl = useIntl();
  const api = useJoanieApi();
  const { user } = useSession();
  const { methods: orderMethods } = useOrders(undefined, { enabled: false });
  const modals = useModals();
  const [state, setState] = useState<ComponentState>(ComponentState.IDLE);
  const [error, setError] = useState<string>();
  const isKeycloakBackend = [APIBackend.KEYCLOAK, APIBackend.FONZIE_KEYCLOAK].includes(
    context?.authentication.backend as APIBackend,
  );
  const accountUrl = isKeycloakBackend
    ? (AuthenticationApi!.account as KeycloakAccountApi).updateUrl()
    : `${context.authentication.endpoint}/account/settings`;

  const confirmWithdrawal = async () => {
    setState(ComponentState.LOADING);
    setError(undefined);
    try {
      await api.user.orders.withdraw(order.id);
      await orderMethods.invalidate();
      props.onClose();
      await modals.messageModal({
        messageType: VariantType.SUCCESS,
        title: intl.formatMessage(messages.successTitle),
        children: intl.formatMessage(messages.successDescription),
      });
    } catch (err) {
      setState(ComponentState.ERROR);
      setError(
        intl.formatMessage(
          err instanceof HttpError && err.code === 422 ? messages.errorExpired : messages.errorGeneric,
        ),
      );
    }
  };

  return (
    <Modal
      {...props}
      size={ModalSize.MEDIUM}
      title={intl.formatMessage(messages.title)}
      closeOnEsc={state !== ComponentState.LOADING}
      preventClose={state === ComponentState.LOADING}
      hideCloseButton={state === ComponentState.LOADING}
      actions={
        <Button
          fullWidth
          color="brand"
          variant="primary"
          onClick={confirmWithdrawal}
          disabled={state === ComponentState.LOADING}
          data-testid="order-withdrawal-modal-confirm-button"
        >
          {state === ComponentState.LOADING ? (
            <Spinner theme="light" aria-labelledby="withdrawal-in-progress">
              <span id="withdrawal-in-progress">
                <FormattedMessage {...messages.confirmInProgress} />
              </span>
            </Spinner>
          ) : (
            <FormattedMessage {...messages.confirmButton} />
          )}
        </Button>
      }
    >
      {error && (
        <Alert type={VariantType.ERROR} className="mb-t">
          {error}
        </Alert>
      )}
      <p className="order-withdrawal-modal__intro">
        <FormattedMessage
          {...messages.intro}
          values={{
            product: (
              <span className="order-withdrawal-modal__product">{`${productTitle} - Ref. ${reference}`}</span>
            ),
          }}
        />
      </p>
      <h3 className="order-withdrawal-modal__section-title">
        <FormattedMessage {...messages.informationTitle} />
      </h3>
      <p className="order-withdrawal-modal__description">
        <FormattedMessage {...messages.informationDescription} />
      </p>
      <dl className="order-withdrawal-modal__details">
        <dt>{intl.formatMessage(messages.nameLabel)}</dt>
        <dd>{user ? UserHelper.getName(user) : ''}</dd>
        <dt>{intl.formatMessage(messages.emailLabel)}</dt>
        <dd>{user?.email}</dd>
        <dt>{intl.formatMessage(messages.orderReferenceLabel)}</dt>
        <dd>{order.id}</dd>
      </dl>
      <p className="order-withdrawal-modal__update-account mt-s">
        <FormattedMessage
          {...messages.updateAccount}
          values={{
            link: (
              <a className="order-withdrawal-modal__update-account__link" href={accountUrl}>
                {intl.formatMessage(messages.updateAccountLinkLabel)}
              </a>
            ),
          }}
        />
      </p>
    </Modal>
  );
};

export default OrderWithdrawalModal;
