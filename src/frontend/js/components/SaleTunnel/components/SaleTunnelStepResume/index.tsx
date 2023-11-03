import { Button } from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { SuccessIcon } from 'components/SuccessIcon';

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
  cta: {
    defaultMessage: 'Start this course now!',
    description: 'Label to the call to action to close sale tunnel',
    id: 'components.SaleTunnelStepResume.cta',
  },
});

interface SaleTunnelStepResumeProps {
  next: () => void;
}

export const SaleTunnelStepResume = ({ next }: SaleTunnelStepResumeProps) => (
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
    </p>
    <footer className="SaleTunnelStepResume__footer">
      <Button onClick={next}>
        <FormattedMessage {...messages.cta} />
      </Button>
    </footer>
  </section>
);
