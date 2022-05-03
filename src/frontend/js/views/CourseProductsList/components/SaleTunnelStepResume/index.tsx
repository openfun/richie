import { defineMessages, FormattedMessage } from 'react-intl';

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
      <svg
        className="SaleTunnelStepResume__success-icon"
        role="img"
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle className="circle back" cx="16" cy="16" r="14" />
        <circle className="circle" cx="16" cy="16" r="14" />
        <polyline className="line back" points="7.5 15.5 14 22.5 24 10.5" />
        <polyline className="line" points="7.5 15.5 14 22.5 24 10.5" />
      </svg>
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
      <button className="button button-sale--primary" onClick={next}>
        <FormattedMessage {...messages.cta} />
      </button>
    </footer>
  </section>
);
