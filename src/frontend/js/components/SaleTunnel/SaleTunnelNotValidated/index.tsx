import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { generatePath } from 'react-router-dom';
import WarningIcon from 'components/WarningIcon';
import { getDashboardBasename } from 'widgets/Dashboard/hooks/useDashboardRouter/getDashboardBasename';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { ProductType } from 'types/Joanie';

const messages = defineMessages({
  apology: {
    defaultMessage: "Sorry, you'll have to wait a little longer!",
    description: 'Text displayed to thank user for his order',
    id: 'components.SaleTunnelSuccessNotValidated.apology',
  },
  title: {
    defaultMessage: 'It takes too long to validate your order.',
    description: 'Message to confirm that order has been created',
    id: 'components.SaleTunnelSuccessNotValidated.title',
  },
  description: {
    defaultMessage:
      'Your payment has succeeded but your order validation is taking too long, you can close this dialog and come back later. You will receive your invoice by email in a few moments.',
    description: "Text to remind that order's invoice will be send by email soon",
    id: 'components.SaleTunnelSuccessNotValidated.description',
  },
  cta: {
    defaultMessage: 'Close',
    description: 'Label to the call to action to close sale tunnel',
    id: 'components.SaleTunnelSuccessNotValidated.cta',
  },
});

const SaleTunnelNotValidated = ({ closeModal }: { closeModal: () => void }) => {
  const intl = useIntl();
  const { order, product } = useSaleTunnelContext();
  return (
    <section className="sale-tunnel-end" data-testid="generic-sale-tunnel-not-validated-step">
      <header className="sale-tunnel-end__header">
        <WarningIcon />
        <h3 className="sale-tunnel-end__title">
          <FormattedMessage {...messages.apology} />
        </h3>
      </header>
      <p className="sale-tunnel-end__content">
        <FormattedMessage {...messages.title} />
        <br />
        <FormattedMessage {...messages.description} />
      </p>
      <footer className="sale-tunnel-end__footer">
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

export default SaleTunnelNotValidated;
