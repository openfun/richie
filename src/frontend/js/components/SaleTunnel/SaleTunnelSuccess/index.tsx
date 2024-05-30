import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { generatePath } from 'react-router-dom';
import { SuccessIcon } from 'components/SuccessIcon';
import { getDashboardBasename } from 'widgets/Dashboard/hooks/useDashboardRouter/getDashboardBasename';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';

const messages = defineMessages({
  congratulations: {
    defaultMessage: 'Congratulations!',
    description: 'Text displayed to thank user for his order',
    id: 'components.SaleTunnelSuccess.congratulations',
  },
  successMessage: {
    defaultMessage: 'Your order has been successfully created.',
    description: 'Message to confirm that order has been created',
    id: 'components.SaleTunnelSuccess.successMessage',
  },
  successDetailMessage: {
    defaultMessage: 'You will receive your invoice by email in a few moments.',
    description: "Text to remind that order's invoice will be send by email soon",
    id: 'components.SaleTunnelSuccess.successDetailMessage',
  },
  successDetailSignatureMessage: {
    defaultMessage:
      'In order to enroll to course runs you first need to sign the training contract.',
    description: 'Text to remind that order needs to be signed',
    id: 'components.SaleTunnelSuccess.successDetailSignatureMessage',
  },
  cta: {
    defaultMessage: 'Start this course now!',
    description: 'Label to the call to action to close sale tunnel',
    id: 'components.SaleTunnelSuccess.cta',
  },
  ctaSignature: {
    defaultMessage: 'Sign the training contract',
    description: 'Label to the call to action to close sale tunnel if there is a pending signature',
    id: 'components.SaleTunnelSuccess.ctaSignature',
  },
});

export const SaleTunnelSuccess = ({ closeModal }: { closeModal: () => void }) => {
  const intl = useIntl();
  const { order, product } = useSaleTunnelContext();
  return (
    <section className="sale-tunnel-end" data-testid="generic-sale-tunnel-success-step">
      <header className="sale-tunnel-end__header">
        <SuccessIcon />
        <h3 className="sale-tunnel-end__title">
          <FormattedMessage {...messages.congratulations} />
        </h3>
      </header>
      <p className="sale-tunnel-end__content">
        <FormattedMessage {...messages.successMessage} />
        <br />
        <FormattedMessage {...messages.successDetailMessage} />
        {product.contract_definition && (
          <>
            <br />
            <FormattedMessage {...messages.successDetailSignatureMessage} />
          </>
        )}
      </p>
      <footer className="sale-tunnel-end__footer">
        {product.contract_definition ? (
          <Button
            href={
              getDashboardBasename(intl.locale) +
              generatePath(LearnerDashboardPaths.ORDER, { orderId: order!.id })
            }
          >
            <FormattedMessage {...messages.ctaSignature} />
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
