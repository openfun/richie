import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useEffect, useState } from 'react';
import { Button, useModal } from '@openfun/cunningham-react';
import PurchaseButton from 'components/PurchaseButton';
import { Icon, IconTypeEnum } from 'components/Icon';
import {
  CertificateProduct,
  Enrollment,
  Order,
  OrderEnrollment,
  OrderState,
  ProductType,
} from 'types/Joanie';
import DownloadCertificateButton from 'components/DownloadCertificateButton';
import { useCertificate } from 'hooks/useCertificates';
import { isOpenedCourseRunCertificate } from 'utils/CourseRuns';
import { OrderHelper } from 'utils/OrderHelper';
import { OrderPaymentRetryModal } from 'widgets/Dashboard/components/DashboardItem/Order/OrderPaymentRetryModal';
import { OrderWithdrawalModal } from 'widgets/Dashboard/components/DashboardItem/Order/OrderWithdrawalModal';
import PaymentScheduleHelper from 'utils/PaymentScheduleHelper';
import { useOrder } from 'hooks/useOrders';
import useDateFormat, { DATETIME_FORMAT } from 'hooks/useDateFormat';
import CertificateStatus from '../../CertificateStatus';

const messages = defineMessages({
  buyProductCertificateLabel: {
    id: 'components.ProductCertificateFooter.buyProductCertificateLabel',
    description: 'Label on the enrollment row that propose to buy a product of type certificate',
    defaultMessage: 'An exam which delivers a certificate can be purchased for this course.',
  },
  downloadProductCertificateLabel: {
    id: 'components.ProductCertificateFooter.downloadProductCertificateLabel',
    description: 'Label on the enrollment row that propose to download a certificate',
    defaultMessage: 'A certificate is available for download.',
  },
  pendingProductCertificateLabel: {
    id: 'components.ProductCertificateFooter.pendingProductCertificateLabel',
    description: 'Label on the enrollment when a product of type certificate have been bought',
    defaultMessage: 'Finish this course to obtain your certificate.',
  },
  failedInstallmentMessage: {
    id: 'components.ProductCertificateFooter.failedInstallmentMessage',
    description: 'Message displayed when the last installment has failed',
    defaultMessage:
      'Last direct debit has failed. Please resolve your situation as soon as possible.',
  },
  examAccessBlocked: {
    id: 'components.ProductCertificateFooter.examAccessBlocked',
    description: 'Message displayed when the exam access is blocked',
    defaultMessage: 'You will be able to pass the exam once the installment has been paid.',
  },
  nextInstallmentMessage: {
    id: 'components.ProductCertificateFooter.nextInstallmentMessage',
    description: 'Message displayed when an installment is pending',
    defaultMessage: 'The next installment ({amount}) will be withdrawn on the {due_date}.',
  },
  paymentNeededButton: {
    id: 'components.ProductCertificateFooter.paymentNeededButton',
    description: 'Button label for the payment needed message',
    defaultMessage: 'Pay {amount}',
  },
  withdrawalDescription: {
    id: 'components.ProductCertificateFooter.withdrawalDescription',
    description: 'Message displayed to offer the withdrawal of the certificate order',
    defaultMessage:
      "If you haven't accessed the exam yet, you can exercise your right of withdrawal until {date}.",
  },
  withdrawalButton: {
    id: 'components.ProductCertificateFooter.withdrawalButton',
    description: 'Button label to open the withdrawal request modal',
    defaultMessage: 'I wish to withdraw',
  },
  pendingWithdrawalMessage: {
    id: 'components.ProductCertificateFooter.pendingWithdrawalMessage',
    description: 'Message displayed when a withdrawal request is being processed',
    defaultMessage: 'Your withdrawal request has been recorded and is being processed.',
  },
});

export interface ProductCertificateFooterProps {
  product: CertificateProduct;
  enrollment: Enrollment;
  isWithdrawable: boolean;
}

const ProductCertificateFooter = ({
  product,
  enrollment,
  isWithdrawable,
}: ProductCertificateFooterProps) => {
  const [order, setOrder] = useState(
    OrderHelper.getActiveEnrollmentOrder(enrollment.orders || [], product.id),
  );
  const isOrderActive = OrderHelper.isActive(order);
  const isPurchasable =
    OrderHelper.isPurchasable(order) && isOpenedCourseRunCertificate(enrollment.course_run.state);
  const isCertificateIssued = isOrderActive && Boolean(order!.certificate_id);
  const hasError =
    isOrderActive && [OrderState.NO_PAYMENT, OrderState.FAILED_PAYMENT].includes(order!.state);

  if (product.type !== ProductType.CERTIFICATE) {
    return null;
  }

  // The course run is no longer available
  // and no product certificate had been bought therefore there isn't any certificate to download.
  if (!isPurchasable && !order) {
    return null;
  }

  return (
    <div className="dashboard-item__course-enrolling__infos">
      {!isOrderActive ? (
        <ProductCertificateStatus />
      ) : (
        <OrderCertificateStatus order={order!} product={product} hasError={hasError} />
      )}
      {isCertificateIssued && (
        <DownloadCertificateButton
          className="dashboard-item__button"
          certificateId={order!.certificate_id!}
        />
      )}
      {isOrderActive && !order!.has_waived_withdrawal_right && order!.eligible_to_withdraw && (
        <WithdrawalManager order={order!} product={product} enrollment={enrollment} />
      )}
      <PurchaseButton
        className="dashboard-item__button"
        product={product}
        enrollment={enrollment}
        isWithdrawable={isWithdrawable}
        buttonProps={{ size: 'small' }}
        disabled={!isPurchasable}
        onFinish={(o) => {
          /**
           * As we do not refetch enrollments in DashboardCourses after SaleTunnel cache invalidation (to avoid
           * scroll reset - and SaleTunnel modal unmounting too early caused by list reset) we need to manually
           * update the active order in the enrollment in order to hide the buy button and display the download button.
           */
          setOrder(o);
        }}
      />
      {hasError && <FailedInstallmentManager order={order!} updateOrder={setOrder} />}
    </div>
  );
};

const ProductCertificateStatus = () => (
  <div className="dashboard-item__block__status">
    <Icon name={IconTypeEnum.CERTIFICATE} />
    <FormattedMessage {...messages.buyProductCertificateLabel} />
  </div>
);

type OrderCertificateStatusProps = {
  order: OrderEnrollment;
  product: CertificateProduct;
  hasError: boolean;
};
const OrderCertificateStatus = ({ order, product, hasError }: OrderCertificateStatusProps) => {
  const { item: certificate } = useCertificate(order?.certificate_id);
  const intl = useIntl();
  const formatDate = useDateFormat();
  const nextInstallment = PaymentScheduleHelper.getPendingInstallment(order?.payment_schedule);
  const canAccessToExam = ![OrderState.PENDING, OrderState.NO_PAYMENT].includes(order.state);
  const isPendingWithdrawal = order.state === OrderState.PENDING_WITHDRAW;
  let statusIcon = IconTypeEnum.CERTIFICATE;
  if (hasError) {
    statusIcon = IconTypeEnum.WARNING;
  } else if (isPendingWithdrawal) {
    statusIcon = IconTypeEnum.CLOCK;
  }

  return (
    <div className="dashboard-item__block__status">
      <Icon name={statusIcon} />
      <p>
        {hasError && (
          <>
            <strong>
              <FormattedMessage {...messages.failedInstallmentMessage} />
            </strong>
            <br />
          </>
        )}
        {isPendingWithdrawal && (
          <>
            <strong>
              <FormattedMessage {...messages.pendingWithdrawalMessage} />
            </strong>
            <br />
          </>
        )}
        {canAccessToExam ? (
          <>
            {product.certificate_definition.title + '. '}
            <CertificateStatus certificate={certificate} productType={product.type} />
          </>
        ) : (
          <FormattedMessage {...messages.examAccessBlocked} />
        )}
        {!hasError && nextInstallment && (
          <>
            <br />
            <FormattedMessage
              {...messages.nextInstallmentMessage}
              values={{
                amount: intl.formatNumber(nextInstallment.amount, {
                  style: 'currency',
                  currency: nextInstallment.currency,
                }),
                due_date: formatDate(nextInstallment.due_date),
              }}
            />
          </>
        )}
      </p>
    </div>
  );
};

type FailedInstallmentManagerProps = {
  order: OrderEnrollment;
  updateOrder: (order: Order) => void;
};
const FailedInstallmentManager = ({ order, updateOrder }: FailedInstallmentManagerProps) => {
  const intl = useIntl();
  const failedInstallment = PaymentScheduleHelper.getFailedInstallment(order!.payment_schedule);
  const installmentRetryModal = useModal();
  const orderQuery = useOrder(order.id);

  useEffect(() => {
    /**
     * As we do not refetch enrollments in DashboardCourses after SaleTunnel cache invalidation (to avoid
     * scroll reset - and SaleTunnel modal unmounting too early caused by list reset) we need to manually
     * update the active order in the enrollment in order to hide the installment manager.
     */
    if (orderQuery.item) {
      updateOrder(orderQuery.item);
    }
  }, [orderQuery.item]);

  if (!failedInstallment) return null;

  return (
    <>
      <div className="dashboard-splitted-card__item__actions">
        <Button size="small" color="brand" variant="primary" onClick={installmentRetryModal.open}>
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
      </div>
      <OrderPaymentRetryModal
        {...installmentRetryModal}
        installment={failedInstallment}
        order={order!}
        onClose={orderQuery.methods.invalidate}
      />
    </>
  );
};

type WithdrawalManagerProps = {
  order: OrderEnrollment;
  product: CertificateProduct;
  enrollment: Enrollment;
};
const WithdrawalManager = ({ order, product, enrollment }: WithdrawalManagerProps) => {
  const intl = useIntl();
  const formatDate = useDateFormat(DATETIME_FORMAT);
  const modal = useModal();

  return (
    <div className="dashboard-item__course-enrolling__infos__withdrawal">
      <div className="dashboard-item__block__status">
        <Icon name={IconTypeEnum.MONEY} />
        <FormattedMessage
          {...messages.withdrawalDescription}
          values={{ date: formatDate(order.withdrawal_date_limit) }}
        />
      </div>
      <Button
        className="dashboard-item__button"
        size="small"
        color="brand"
        variant="secondary"
        onClick={modal.open}
      >
        {intl.formatMessage(messages.withdrawalButton)}
      </Button>
      <OrderWithdrawalModal
        {...modal}
        order={order}
        productTitle={product.title}
        reference={enrollment.course_run.course.code}
      />
    </div>
  );
};

export default ProductCertificateFooter;
