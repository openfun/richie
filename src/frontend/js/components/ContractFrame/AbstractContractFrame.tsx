import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Button, Loader } from '@openfun/cunningham-react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Modal } from 'components/Modal';
import { Maybe } from 'types/utils';
import { CONTRACT_SETTINGS } from 'settings';
import Banner, { BannerType } from 'components/Banner';
import { SuccessIcon } from 'components/SuccessIcon';

/*
  /!\ This component should not be used directly, only its implementations should be.
  Take a look at:
    - ./OrganizationContractFrame.tsx
    - ./LearnerContractFrame.tsx
*/

const LazySignatureDummy = lazy(
  () => import('widgets/Dashboard/components/Signature/SignatureDummy'),
);
const LazySignatureLexPersona = lazy(
  () => import('widgets/Dashboard/components/Signature/SignatureLexPersona'),
);

export const messages = defineMessages({
  errorSubmitForSignature: {
    defaultMessage:
      'An error happened while initializing the signature process. Please retry later.',
    description: 'Message displayed inside the contract signin modal while an error occurred.',
    id: 'components.DashboardItem.Order.ContractFrame.errorSubmitForSignature',
  },
  errorMaxPolling: {
    defaultMessage: 'The signature is taking more time than expected ... please come back later.',
    description:
      'Message displayed inside the contract signin modal if the order polling has reached its maximum attempts.',
    id: 'components.DashboardItem.Order.ContractFrame.errorMaxPolling',
  },
  errorPolling: {
    defaultMessage: 'An error happened while verifying signature. Please come back later.',
    description:
      'Message displayed inside the contract signin modal if the order polling failed a request.',
    id: 'components.DashboardItem.Order.ContractFrame.errorPolling',
  },
  loadingContract: {
    defaultMessage: 'Loading your contract ...',
    description: 'Message displayed inside the contract signin modal when loading the contract.',
    id: 'components.DashboardItem.Order.ContractFrame.loadingContract',
  },
  polling: {
    defaultMessage: 'Verifying signature ...',
    description: 'Message displayed inside the contract signin modal when polling the order.',
    id: 'components.DashboardItem.Order.ContractFrame.polling',
  },
  pollingDescription: {
    defaultMessage:
      'We are waiting for the signature to be validated from our signature platform. It can take up to few minutes. Do not close this page.',
    description: 'Message displayed inside the contract signin modal when polling the order.',
    id: 'components.DashboardItem.Order.ContractFrame.pollingDescription',
  },
  finishedCaption: {
    defaultMessage: 'Congratulations!',
    description: 'Title displayed inside the contract signin modal when the contract is signed.',
    id: 'components.DashboardItem.Order.ContractFrame.finishedCaption',
  },
  finishedDescription: {
    defaultMessage:
      'You will receive an email once your contract will be fully signed. You can now enroll in your course runs!',
    description: 'Message displayed inside the contract signin modal when the contract is signed.',
    id: 'components.DashboardItem.Order.ContractFrame.finishedDescription',
  },
  finishedButton: {
    defaultMessage: 'Next',
    description: 'Button displayed inside the contract signin modal when the contract is signed.',
    id: 'components.DashboardItem.Order.ContractFrame.finishedButton',
  },
});

const DUMMY_REGEX = /https:\/\/dummysignaturebackend.fr/;

enum SignatureType {
  LEX = 'lex',
  DUMMY = 'dummy',
}

enum ContractSteps {
  LOADING_CONTRACT,
  SIGNING,
  POLLING,
  FINISHED,
  ERROR,
  NONE,
}

export interface AbstractProps {
  isOpen: boolean;
  onDone?: () => void;
  onClose?: () => void;
}

export interface Props extends AbstractProps {
  getInvitationLink: () => Promise<string>;
  checkSignature: () => Promise<{ isSigned: boolean }>;
}

type FrameContentProps = Omit<Props, 'isOpen'>;

export interface SignatureProps {
  onDone: () => void;
  onError: (error: string) => void;
  invitationLink: string;
}

const AbstractContractFrame = ({ isOpen, ...props }: Props) => {
  return (
    <Modal
      isOpen={isOpen}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      onRequestClose={props.onClose}
    >
      <ContractFrameContent {...props} />
    </Modal>
  );
};

const ContractFrameContent = ({
  getInvitationLink,
  checkSignature,
  onClose,
  onDone,
}: FrameContentProps) => {
  const intl = useIntl();
  const [step, setStep] = useState(ContractSteps.LOADING_CONTRACT);
  const [signatureType, setSignatureType] = useState<SignatureType>();
  const [invitationLink, setInvitationLink] = useState<Maybe<string>>();
  const [error, setError] = useState<Maybe<string>>();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setErrored = (e: string) => {
    setStep(ContractSteps.ERROR);
    setError(e);
  };

  const onSigned = () => {
    startStepPoll();
  };

  const onSignatureError = (e: string) => {
    setErrored(e);
  };

  /*
    1. Start the signature process.
       Retrieve the signature link then go to the signature step.
  */
  const start = async () => {
    try {
      const link = await getInvitationLink();
      startStepSign(link);
    } catch (e) {
      setErrored(intl.formatMessage(messages.errorSubmitForSignature));
    }
  };

  /*
    2. Instantiate the right signature interface according to the invitation link.
       Then go to signing step.
  */
  const startStepSign = async (signatureLink: string) => {
    setInvitationLink(signatureLink);
    if (signatureLink.match(DUMMY_REGEX)) {
      // Nothing to do, in dummy mode submitting for signature automatically signs the contract.
      setSignatureType(SignatureType.DUMMY);
    } else {
      // Open iframe then wait for it to close.
      setSignatureType(SignatureType.LEX);
    }
    setStep(ContractSteps.SIGNING);
  };

  /*
    3. Once the signature is done, start the polling step.
       Poll the backend until it has been notified by signature provided.
       Then, when it's done, finish the signature process.
  */
  const startStepPoll = async () => {
    setStep(ContractSteps.POLLING);
    let round = 0;

    const poll = async () => {
      if (round >= CONTRACT_SETTINGS.pollLimit) {
        timeoutRef.current = undefined;
        setErrored(intl.formatMessage(messages.errorMaxPolling));
      } else {
        try {
          const { isSigned } = await checkSignature();
          if (isSigned) {
            timeoutRef.current = undefined;
            finish();
          } else {
            round++;
            timeoutRef.current = setTimeout(poll, CONTRACT_SETTINGS.pollInterval);
          }
        } catch (e) {
          setErrored(intl.formatMessage(messages.errorPolling));
        }
      }
    };

    poll();
  };

  /*
    4. Finish the signature process.
       And exec the onDone callback if there is.
  */
  const finish = () => {
    setStep(ContractSteps.FINISHED);
    onDone?.();
  };

  const renderLoadingContract = () => {
    return (
      <div className="ContractFrame__loading-container">
        <h3 className="ContractFrame__caption">
          <FormattedMessage {...messages.loadingContract} />
        </h3>
        <Loader />
      </div>
    );
  };

  useEffect(() => {
    start();
  }, []);

  return (
    <div className="ContractFrame__modal-body" data-testid="dashboard-contract-frame">
      {error && <Banner message={error} type={BannerType.ERROR} />}
      {step === ContractSteps.LOADING_CONTRACT && renderLoadingContract()}
      {step === ContractSteps.SIGNING && (
        <Suspense fallback={renderLoadingContract()}>
          {signatureType === SignatureType.DUMMY && (
            <LazySignatureDummy
              onDone={onSigned}
              onError={onSignatureError}
              invitationLink={invitationLink!}
            />
          )}
          {signatureType === SignatureType.LEX && (
            <LazySignatureLexPersona
              onDone={onSigned}
              onError={onSignatureError}
              invitationLink={invitationLink!}
            />
          )}
        </Suspense>
      )}
      {step === ContractSteps.POLLING && (
        <div className="ContractFrame__loading-container">
          <div>
            <h3 className="ContractFrame__caption">
              <FormattedMessage {...messages.polling} />
            </h3>
            <p className="ContractFrame__content">
              <FormattedMessage {...messages.pollingDescription} />
            </p>
          </div>
          <Loader />
        </div>
      )}
      {step === ContractSteps.FINISHED && (
        <div className="ContractFrame__finished">
          <SuccessIcon />
          <h3 className="ContractFrame__caption">
            <FormattedMessage {...messages.finishedCaption} />
          </h3>
          <p className="ContractFrame__content">
            <FormattedMessage {...messages.finishedDescription} />
          </p>
          <Button onClick={onClose}>
            <FormattedMessage {...messages.finishedButton} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default AbstractContractFrame;
