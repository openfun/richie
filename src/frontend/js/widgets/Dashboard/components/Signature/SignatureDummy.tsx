import React, { useState } from 'react';
import { Button, Loader } from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { SignatureProps } from 'components/ContractFrame';
import { DummyContractPlaceholder } from 'widgets/Dashboard/components/Signature/DummyContractPlaceholder';
import { CONTRACT_SETTINGS } from 'settings';
import { getAPIEndpoint } from 'api/joanie';

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

export const SignatureDummy = ({ invitationLink, onDone }: SignatureProps) => {
  const [step, setStep] = useState(SignatureDummySteps.SIGNING);

  const baseUrl = getAPIEndpoint();
  // eslint-disable-next-line compat/compat
  const link = new URL(invitationLink);
  const reference = link.searchParams.get('reference');
  const event = link.searchParams.get('eventTarget');
  const sendSignatureNotification = () => {
    fetch(`${baseUrl}/signature/notifications/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: event,
        reference,
      }),
    });
  };

  const sign = () => {
    setStep(SignatureDummySteps.SIGNING_LOADING);
    setTimeout(() => {
      sendSignatureNotification();
      onDone();
    }, CONTRACT_SETTINGS.dummySignatureSignTimeout);
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
        <div className="ContractFrame__container">
          <h3 className="ContractFrame__caption">
            <FormattedMessage {...messages.signing} />
          </h3>
          <div className="ContractFrame__footer">
            <Loader />
          </div>
        </div>
      )}
    </>
  );
};

export default SignatureDummy;
