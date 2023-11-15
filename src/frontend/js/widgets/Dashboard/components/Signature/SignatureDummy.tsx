import React, { useState } from 'react';
import { Button, Loader } from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { SignatureProps } from 'widgets/Dashboard/components/DashboardItem/Order/ContractFrame';
import { DummyContractPlaceholder } from 'widgets/Dashboard/components/Signature/DummyContractPlaceholder';

const messages = defineMessages({
  button: {
    defaultMessage: 'Sign',
    description: 'Button displayed below the dummy contract.',
    id: 'components.Dashboard.Signature.SignatureDummy.button',
  },
  signing: {
    defaultMessage: 'Signing the contract ...',
    description: 'Message displayed after signing the dummy contract.',
    id: 'components.Dashboard.Signature.SignatureDummy.signing',
  },
});

enum SignatureDummySteps {
  SIGNING,
  SIGNING_LOADING,
}

export const SignatureDummy = ({ onDone }: SignatureProps) => {
  const [step, setStep] = useState(SignatureDummySteps.SIGNING);

  const sign = () => {
    setStep(SignatureDummySteps.SIGNING_LOADING);
    setTimeout(() => {
      onDone();
    }, 2000);
  };

  return (
    <>
      {step === SignatureDummySteps.SIGNING && (
        <div className="ContractFrame__dummy">
          <DummyContractPlaceholder />
          <Button onClick={sign}>
            <FormattedMessage {...messages.button} />
          </Button>
        </div>
      )}
      {step === SignatureDummySteps.SIGNING_LOADING && (
        <div className="ContractFrame__loading-container">
          <h3 className="ContractFrame__caption">
            <FormattedMessage {...messages.signing} />
          </h3>
          <Loader />
        </div>
      )}
    </>
  );
};

export default SignatureDummy;
