import { Alert, Checkbox, VariantType } from '@openfun/cunningham-react';
import { useCallback, useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl/lib';
import { useSaleTunnelContext } from 'components/SaleTunnel/GenericSaleTunnel';

const messages = defineMessages({
  waiveCheckboxExplanation: {
    defaultMessage:
      'This training will start before the end of your withdrawal period. You must waive it to subscribe.',
    description: 'Text to explain why the user has to waive to its withdrawal right.',
    id: 'components.SaleTunnel.WithdrawRightCheckbox.waiverLabel',
  },
  waiveCheckboxLabel: {
    defaultMessage: 'I waive my right of withdrawal',
    description: 'Label of the checkbox to waive the withdrawal right.',
    id: 'components.SaleTunnel.WithdrawRightCheckbox.waiveCheckboxLabel',
  },
});

const WithdrawRightCheckbox = () => {
  const {
    product,
    registerSubmitCallback,
    unregisterSubmitCallback,
    hasWaivedWithdrawalRight,
    setHasWaivedWithdrawalRight,
  } = useSaleTunnelContext();
  const [hasErrorState, setHasError] = useState(false);
  const setError = useCallback(async () => {
    setHasError(!product.is_withdrawable && !hasWaivedWithdrawalRight);
  }, [hasWaivedWithdrawalRight, product.is_withdrawable]);

  useEffect(() => {
    registerSubmitCallback('withdrawalRight', setError);
    return () => {
      unregisterSubmitCallback('withdrawalRight');
    };
  }, [setError]);

  if (product.is_withdrawable) return null;
  return (
    <section
      className="mt-t subscription-button__waiveCheckbox"
      data-testid="withdraw-right-checkbox"
    >
      <Alert type={hasErrorState ? VariantType.ERROR : VariantType.WARNING} className="mb-s">
        <FormattedMessage {...messages.waiveCheckboxExplanation} />
      </Alert>
      <Checkbox
        className="waiveCheckbox__input"
        label={<FormattedMessage {...messages.waiveCheckboxLabel} />}
        checked={hasWaivedWithdrawalRight}
        onChange={(e) => setHasWaivedWithdrawalRight(e.target.checked)}
      />
    </section>
  );
};

export default WithdrawRightCheckbox;
