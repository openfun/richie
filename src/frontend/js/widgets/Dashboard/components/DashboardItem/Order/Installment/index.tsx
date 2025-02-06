import { Alert, Button, useModal, VariantType } from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';
import { CredentialOrder, CredentialProduct, OrderState } from 'types/Joanie';
import { OrderHelper } from 'utils/OrderHelper';
import { useCourseProduct } from 'hooks/useCourseProducts';
import { OrderPaymentDetailsModal } from 'widgets/Dashboard/components/DashboardItem/Order/OrderPaymentDetailsModal';
import { OrderPaymentRetryModal } from 'widgets/Dashboard/components/DashboardItem/Order/OrderPaymentRetryModal';
import { SaleTunnel } from 'components/SaleTunnel';
import { Spinner } from 'components/Spinner';
import PaymentScheduleHelper from 'utils/PaymentScheduleHelper';

const messages = defineMessages({
  paymentTitle: {
    id: 'components.DashboardItemOrder.Installment.paymentTitle',
    description: 'Label for the payment block',
    defaultMessage: 'Payment',
  },
  paymentMethodMissingMessage: {
    id: 'components.DashboardItemOrder.Installment.paymentMethodMissingMessage',
    description: 'Message displayed when payment method is missing',
    defaultMessage: 'To finalize your subscription, you must define a payment method.',
  },
  paymentInactiveDescription: {
    id: 'components.DashboardItemOrder.Installment.paymentInactiveDescription',
    description:
      'Explanation displayed when the order is not yet active and do not miss payment method',
    defaultMessage:
      'You will able to manage your payment installment here once your subscription is finalized.',
  },
  paymentNeededMessage: {
    id: 'components.DashboardItemOrder.Installment.paymentNeededMessage',
    description: 'Message displayed when payment is needed',
    defaultMessage: 'A payment failed, please update your payment method',
  },
  paymentNeededButton: {
    id: 'components.DashboardItemOrder.Installment.paymentNeededButton',
    description: 'Button label for the payment needed message',
    defaultMessage: 'Pay {amount}',
  },
  paymentLabel: {
    id: 'components.DashboardItemOrder.Installment.paymentLabel',
    description: 'Label for the payment block',
    defaultMessage: 'You can see and manage all installments.',
  },
  paymentButton: {
    id: 'components.DashboardItemOrder.Installment.paymentButton',
    description: 'Button label for the payment block',
    defaultMessage: 'Manage payment',
  },
  defineButton: {
    id: 'components.DashboardItemOrder.Installment.defineButton',
    description: 'Button label to define payment method',
    defaultMessage: 'Define',
  },
});

type Props = {
  order: CredentialOrder;
};

const Installment = ({ order }: Props) => {
  const isActive = OrderHelper.isActive(order);
  const isCanceled = OrderHelper.isCanceled(order);
  const failedInstallment = PaymentScheduleHelper.getFailedInstallment(order.payment_schedule);
  const needsPaymentMethod = order.state === OrderState.TO_SAVE_PAYMENT_METHOD;
  const shouldDisplayDot = needsPaymentMethod || !!failedInstallment;

  return (
    <div
      id="dashboard-item-payment-method"
      data-testid="dashboard-item-payment-method"
      className="dashboard-splitted-card__item"
    >
      <div
        className={classNames('dashboard-splitted-card__item__title', {
          'dashboard-splitted-card__item__title--dot': shouldDisplayDot,
        })}
      >
        <span>
          <FormattedMessage {...messages.paymentTitle} />
        </span>
      </div>
      {!isActive && !isCanceled && !needsPaymentMethod && (
        <p className="dashboard-splitted-card__item__description">
          <FormattedMessage {...messages.paymentInactiveDescription} />
        </p>
      )}
      <PaymentMethodManager order={order} />
      {(isActive || isCanceled) && <InstallmentManager order={order} />}
    </div>
  );
};

const PaymentMethodManager = ({ order }: Props) => {
  const needsPaymentMethod = order.state === OrderState.TO_SAVE_PAYMENT_METHOD;
  const { item: relation, states } = useCourseProduct({
    course_id: order.course.code,
    product_id: order.product_id,
  });
  const modal = useModal({ isOpenDefault: false });

  if (!order || states.fetching) {
    return <Spinner size="small" />;
  }

  return (
    <>
      {needsPaymentMethod && (
        <div>
          <p>
            <FormattedMessage {...messages.paymentMethodMissingMessage} />
          </p>
          <Button size="small" onClick={modal.open}>
            <FormattedMessage {...messages.defineButton} />
          </Button>
        </div>
      )}
      <SaleTunnel
        {...modal}
        product={relation.product as CredentialProduct}
        course={relation.course}
        isWithdrawable={relation.is_withdrawable}
      />
    </>
  );
};

const InstallmentManager = ({ order }: Props) => {
  const intl = useIntl();
  const modal = useModal();
  const retryModal = useModal();
  const failedInstallment = PaymentScheduleHelper.getFailedInstallment(order.payment_schedule);

  const pay = async () => {
    retryModal.open();
  };
  return (
    <>
      {failedInstallment && (
        <Alert
          className="mb-t"
          type={VariantType.ERROR}
          buttons={
            <Button size="small" onClick={pay}>
              <FormattedMessage
                {...messages.paymentNeededButton}
                values={{
                  amount: intl.formatNumber(failedInstallment.amount, {
                    style: 'currency',
                    currency: failedInstallment.currency,
                  }),
                }}
              />
            </Button>
          }
        >
          <FormattedMessage {...messages.paymentNeededMessage} />
        </Alert>
      )}
      <div className="dashboard-splitted-card__item__description">
        <FormattedMessage {...messages.paymentLabel} />
      </div>
      <div className="dashboard-splitted-card__item__actions">
        <Button size="small" color="secondary" onClick={modal.open}>
          <FormattedMessage {...messages.paymentButton} />
        </Button>
      </div>
      <OrderPaymentDetailsModal {...modal} order={order} />
      {failedInstallment && (
        <OrderPaymentRetryModal {...retryModal} installment={failedInstallment} order={order} />
      )}
    </>
  );
};

export default Installment;
