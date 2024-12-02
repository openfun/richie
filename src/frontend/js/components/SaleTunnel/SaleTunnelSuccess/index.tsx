import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { generatePath } from 'react-router';
import { SuccessIcon } from 'components/SuccessIcon';
import { getDashboardBasename } from 'widgets/Dashboard/hooks/useDashboardRouter/getDashboardBasename';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { ProductType } from 'types/Joanie';

const messages = defineMessages({
  congratulations: {
    defaultMessage: 'Subscription confirmed!',
    description: 'Text displayed to thank user for his order',
    id: 'components.SaleTunnelSuccess.congratulations',
  },
  successMessage: {
    defaultMessage: 'Your order has been successfully registered.',
    description: 'Message to confirm that order has been created',
    id: 'components.SaleTunnelSuccess.successMessage',
  },
  successDetailMessage: {
    defaultMessage:
      'You will be able to start your training once the first installment will be paid.',
    description: 'Text to explain when the user will be able to start its training.',
    id: 'components.SaleTunnelSuccess.successDetailMessage',
  },
  cta: {
    defaultMessage: 'Close',
    description: 'Label to the call to action to close sale tunnel',
    id: 'components.SaleTunnelSuccess.cta',
  },
});

export const SaleTunnelSuccess = ({ closeModal }: { closeModal: () => void }) => {
  const intl = useIntl();
  const { order, product } = useSaleTunnelContext();

  return (
    <section className="sale-tunnel-step" data-testid="generic-sale-tunnel-success-step">
      <header className="sale-tunnel-step__header">
        <SuccessIcon />
        <h3 className="sale-tunnel-step__title">
          <FormattedMessage {...messages.congratulations} />
        </h3>
      </header>
      <p className="sale-tunnel-step__content">
        <FormattedMessage {...messages.successMessage} />
        <br />
        <FormattedMessage {...messages.successDetailMessage} />
      </p>
      <footer className="sale-tunnel-step__footer">
        {product.type === ProductType.CREDENTIAL ? (
          <Button
            href={
              getDashboardBasename(intl.locale) +
              generatePath(LearnerDashboardPaths.ORDER, { orderId: order!.id })
            }
          >
            <FormattedMessage {...messages.cta} />
          </Button>
        ) : (
          <Button onClick={closeModal}>
            <FormattedMessage {...messages.cta} />
          </Button>
        )}
      </footer>
    </section>
  );
};
