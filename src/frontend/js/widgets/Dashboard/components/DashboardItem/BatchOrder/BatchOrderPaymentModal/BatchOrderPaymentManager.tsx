import React, { useEffect } from 'react';
import { Button, useModal } from '@openfun/cunningham-react';
import { useIntl, FormattedMessage, defineMessages } from 'react-intl';
import { useBatchOrder } from 'hooks/useBatchOrder';
import { BatchOrderRead, BatchOrderState } from 'types/Joanie';
import { DashboardSubItem } from 'widgets/Dashboard/components/DashboardItem/DashboardSubItem';
import { DashboardSubItemsList } from '../../DashboardSubItemsList';
import { BatchOrderPaymentModal } from '.';

const messages = defineMessages({
  batchOrderPayment: {
    id: 'components.ProductCertificateFooter.batchOrderPayment',
    description: 'Label before the payment button',
    defaultMessage: 'We are waiting for your payment to finalize the batch order.',
  },
  paymentProcessing: {
    id: 'components.ProductCertificateFooter.paymentProcessing',
    description: 'Button label for the payment is processing message',
    defaultMessage: 'Payment processing...',
  },
  paymentNeededButton: {
    id: 'components.ProductCertificateFooter.paymentNeededButton',
    description: 'Button label for the payment needed message',
    defaultMessage: 'Pay {amount}',
  },
  paymentSectionTitle: {
    id: 'batchOrder.payment.sectionTitle',
    description: 'Title for the payment section in dashboard',
    defaultMessage: 'Payment required',
  },
});

interface BatchPaymentManagerProps {
  batchOrder: BatchOrderRead;
}

export const BatchOrderPaymentManager = ({ batchOrder }: BatchPaymentManagerProps) => {
  const intl = useIntl();
  const retryModal = useModal();
  const batchOrderQuery = useBatchOrder(batchOrder.id);
  const processingPayment = batchOrder.state === BatchOrderState.PROCESS_PAYMENT;

  useEffect(() => {
    if (batchOrderQuery.item) {
      batchOrderQuery.methods.invalidate();
    }
  }, [batchOrderQuery.item]);

  return (
    <DashboardSubItemsList
      subItems={[
        <DashboardSubItem
          title={intl.formatMessage(messages.paymentSectionTitle)}
          footer={
            <div className="content">
              <FormattedMessage {...messages.batchOrderPayment} />
              <Button
                size="small"
                color="primary"
                onClick={retryModal.open}
                disabled={processingPayment}
              >
                {processingPayment ? (
                  <FormattedMessage {...messages.paymentProcessing} />
                ) : (
                  <FormattedMessage
                    {...messages.paymentNeededButton}
                    values={{
                      amount: intl.formatNumber(batchOrder.total ?? 0, {
                        style: 'currency',
                        currency: batchOrder.currency ?? 'EUR',
                      }),
                    }}
                  />
                )}
              </Button>
              <BatchOrderPaymentModal
                {...retryModal}
                batchOrder={batchOrder}
                onClose={batchOrderQuery.methods.invalidate}
              />
            </div>
          }
        />,
      ]}
    />
  );
};
