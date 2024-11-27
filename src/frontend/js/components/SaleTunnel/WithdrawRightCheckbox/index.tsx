import { Alert, Checkbox, VariantType } from '@openfun/cunningham-react';
import { useCallback, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';
import { ProductType } from 'types/Joanie';

const messages = defineMessages({
  waiveCheckboxLabel: {
    defaultMessage: 'By checking this box:',
    description: 'Label of the checkbox to waive the withdrawal right.',
    id: 'components.SaleTunnel.WithdrawRightCheckbox.waiveCheckboxLabel',
  },
});

const credentialProductMessages = defineMessages({
  waiveCheckboxExplanation: {
    defaultMessage:
      'The training program you wish to enroll in begins before the end of the 14-day withdrawal period mentioned in Article L221-18 of the French Consumer Code. You must check the box below to proceed with your registration.',
    description: 'Text to explain why the user has to waive to its withdrawal right.',
    id: 'components.SaleTunnel.WithdrawRightCheckbox.credential.waiverLabel',
  },
  waiveCheckboxHelperClause1: {
    defaultMessage:
      'I acknowledge that I have expressly requested to begin the training before the expiration date of the withdrawal period.',
    description: 'First clause item for the waiver checkbox.',
    id: 'components.SaleTunnel.WithdrawRightCheckbox.credential.waiveCheckboxHelperClause1',
  },
  waiveCheckboxHelperClause2: {
    defaultMessage:
      'I expressly waive my right of withdrawal in order to begin the training before the expiration of the withdrawal period.',
    description: 'Second clause item for the waiver checkbox.',
    id: 'components.SaleTunnel.WithdrawRightCheckbox.credential.waiveCheckboxHelperClause2',
  },
});

const certificateProductMessages = defineMessages({
  waiveCheckboxExplanation: {
    defaultMessage:
      'If you access the exam, you acknowledge waiving your 14-day withdrawal right, as provided for in Article L221-18 of the French Consumer Code.',
    description: 'Text to explain why the user has to waive to its withdrawal right.',
    id: 'components.SaleTunnel.WithdrawRightCheckbox.certificate.waiverLabel',
  },
  waiveCheckboxHelperClause1: {
    defaultMessage:
      'I acknowledge that I have been informed of my legal right of withdrawal, which allows me to cancel my registration within 14 days from the date of payment.',
    description: 'First clause item for the waiver checkbox.',
    id: 'components.SaleTunnel.WithdrawRightCheckbox.certificate.waiveCheckboxHelperClause1',
  },
  waiveCheckboxHelperClause2: {
    defaultMessage:
      'I understand that if I access the exam during this period, I expressly waive my right of withdrawal.',
    description: 'Second clause item for the waiver checkbox.',
    id: 'components.SaleTunnel.WithdrawRightCheckbox.certificate .waiveCheckboxHelperClause2',
  },
});

const WithdrawRightCheckbox = () => {
  const {
    props: { isWithdrawable, product },
    registerSubmitCallback,
    unregisterSubmitCallback,
    hasWaivedWithdrawalRight,
    setHasWaivedWithdrawalRight,
  } = useSaleTunnelContext();
  const intl = useIntl();
  const clauseMessages =
    product.type === ProductType.CERTIFICATE
      ? certificateProductMessages
      : credentialProductMessages;
  const [hasErrorState, setHasError] = useState(false);
  const setError = useCallback(async () => {
    setHasError(!isWithdrawable && !hasWaivedWithdrawalRight);
  }, [hasWaivedWithdrawalRight, isWithdrawable]);

  useEffect(() => {
    registerSubmitCallback('withdrawalRight', setError);
    return () => {
      unregisterSubmitCallback('withdrawalRight');
    };
  }, [setError]);

  if (isWithdrawable) return null;
  return (
    <section
      className="mt-t subscription-button__waiveCheckbox"
      data-testid="withdraw-right-checkbox"
    >
      <Alert type={hasErrorState ? VariantType.ERROR : VariantType.WARNING} className="mb-s">
        <FormattedMessage {...clauseMessages.waiveCheckboxExplanation} />
      </Alert>
      <Checkbox
        className="waiveCheckbox__input"
        label={intl.formatMessage(messages.waiveCheckboxLabel)}
        checked={hasWaivedWithdrawalRight}
        onChange={(e) => setHasWaivedWithdrawalRight(e.target.checked)}
        textItems={[
          intl.formatMessage(clauseMessages.waiveCheckboxHelperClause1),
          intl.formatMessage(clauseMessages.waiveCheckboxHelperClause2),
        ]}
      />
    </section>
  );
};

export default WithdrawRightCheckbox;
