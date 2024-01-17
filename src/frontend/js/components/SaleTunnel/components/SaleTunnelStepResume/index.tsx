import { Button } from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { SuccessIcon } from 'components/SuccessIcon';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { getDashboardBasename } from 'widgets/Dashboard/hooks/useDashboardRouter/getDashboardBasename';
import { useSaleTunnelContext } from 'components/SaleTunnel/context';
import { getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';

const messages = defineMessages({
  congratulations: {
    defaultMessage: 'Congratulations!',
    description: 'Text displayed to thank user for his order',
    id: 'components.SaleTunnelStepResume.congratulations',
  },
  successMessage: {
    defaultMessage: 'Your order has been successfully created.',
    description: 'Message to confirm that order has been created',
    id: 'components.SaleTunnelStepResume.successMessage',
  },
  successDetailMessage: {
    defaultMessage: 'You will receive your invoice by email in a few moments.',
    description: "Text to remind that order's invoice will be send by email soon",
    id: 'components.SaleTunnelStepResume.successDetailMessage',
  },
  successDetailSignatureMessage: {
    defaultMessage:
      'In order to enroll to course runs you first need to sign the training contract.',
    description: 'Text to remind that order needs to be signed',
    id: 'components.SaleTunnelStepResume.successDetailSignatureMessage',
  },
  cta: {
    defaultMessage: 'Start this course now!',
    description: 'Label to the call to action to close sale tunnel',
    id: 'components.SaleTunnelStepResume.cta',
  },
  ctaSignature: {
    defaultMessage: 'Sign the training contract',
    description: 'Label to the call to action to close sale tunnel if there is a pending signature',
    id: 'components.SaleTunnelStepResume.ctaSignature',
  },
});

interface SaleTunnelStepResumeProps {
  next: () => void;
}

export const SaleTunnelStepResume = ({ next }: SaleTunnelStepResumeProps) => {
  const intl = useIntl();
  const { order, product } = useSaleTunnelContext();

  return (
    <section className="SaleTunnelStepResume">
      <header className="SaleTunnelStepResume__header">
        <SuccessIcon />
        <h3 className="SaleTunnelStepResume__title">
          <FormattedMessage {...messages.congratulations} />
        </h3>
      </header>
      <p className="SaleTunnelStepResume__content">
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
      <footer className="SaleTunnelStepResume__footer">
        {product.contract_definition ? (
          <Button
            href={
              getDashboardBasename(intl.locale) +
              getDashboardRoutePath(intl)(LearnerDashboardPaths.ORDER, { orderId: order!.id })
            }
          >
            <FormattedMessage {...messages.ctaSignature} />
          </Button>
        ) : (
          <Button onClick={next}>
            <FormattedMessage {...messages.cta} />
          </Button>
        )}
      </footer>
    </section>
  );
};
