import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Button, Loader } from '@openfun/cunningham-react';
import { useQueryClient } from '@tanstack/react-query';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Modal } from 'components/Modal';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { CredentialOrder, Order, Product } from 'types/Joanie';
import { Maybe } from 'types/utils';
import { CONTRACT_SETTINGS } from 'settings';
import { orderNeedsSignature } from 'widgets/Dashboard/components/DashboardItem/utils/order';
import Banner, { BannerType } from 'components/Banner';
import { SuccessIcon } from 'components/SuccessIcon';

const LazySignatureDummy = lazy(
  () => import('widgets/Dashboard/components/Signature/SignatureDummy'),
);
const LazySignatureLexPersona = lazy(
  () => import('widgets/Dashboard/components/Signature/SignatureLexPersona'),
);

const messages = defineMessages({
  errorSubmitForSignature: {
    defaultMessage: 'An error happened while creating the contract. Please retry later.',
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
    defaultMessage: 'An error happened while fetching the order. Please come back later.',
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
  finishedCaption: {
    defaultMessage: 'Congratulations!',
    description: 'Title displayed inside the contract signin modal when the contract is signed.',
    id: 'components.DashboardItem.Order.ContractFrame.finishedCaption',
  },
  finishedDescription: {
    defaultMessage:
      'You will receive an email containing your contract signed. You can now enroll to your course runs!',
    description: 'Message displayed inside the contract signin modal when the contract is signed.',
    id: 'components.DashboardItem.Order.ContractFrame.finishedDescription',
  },
  finishedButton: {
    defaultMessage: 'Next',
    description: 'Button displayed inside the contract signin modal when the contract is signed.',
    id: 'components.DashboardItem.Order.ContractFrame.finishedButton',
  },
});

interface Props {
  order: CredentialOrder;
  product: Product;
  isOpen: boolean;
  onDone: () => void;
  onClose: () => void;
}

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

export interface SignatureProps {
  onDone: () => void;
  onError: (error: string) => void;
  invitationLink: string;
}

export const ContractFrame = (props: Props) => {
  return (
    <Modal
      isOpen={props.isOpen}
      shouldCloseOnOverlayClick={false}
      shouldCloseOnEsc={false}
      onRequestClose={props.onClose}
      testId={'contract-frame__' + props.order.id}
    >
      <ContractFrameContent {...props} />
    </Modal>
  );
};

export const ContractFrameContent = ({ order, onClose, onDone, product }: Props) => {
  const api = useJoanieApi();
  const intl = useIntl();
  const [step, setStep] = useState(ContractSteps.LOADING_CONTRACT);
  const [signatureType, setSignatureType] = useState<SignatureType>();
  const [invitationLink, setInvitationLink] = useState<Maybe<string>>();
  const [error, setError] = useState<Maybe<string>>();
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setErrored = (e: string) => {
    setStep(ContractSteps.ERROR);
    setError(e);
  };

  const initialize = async () => {
    try {
      const response = await api.user.orders.submit_for_signature(order.id);
      await stepSign(response.invitation_link);
    } catch (e) {
      setErrored(intl.formatMessage(messages.errorSubmitForSignature));
    }
  };

  const stepSign = async (invitationLink_: string) => {
    setInvitationLink(invitationLink_);
    if (invitationLink_.match(DUMMY_REGEX)) {
      // Nothing to do, in dummy mode submitting for signature automatically signs the contract.
      setSignatureType(SignatureType.DUMMY);
    } else {
      // Open iframe then wait for it to close.
      setSignatureType(SignatureType.LEX);
    }
    setStep(ContractSteps.SIGNING);
  };

  const onSigned = () => {
    stepPoll();
  };

  // Polling the order from the backend waiting for it to have processed the inbound lex persona
  // webhook.
  const stepPoll = async () => {
    setStep(ContractSteps.POLLING);
    let round = 0;
    const checkOrderSignature = async () => {
      if (round >= CONTRACT_SETTINGS.pollLimit) {
        timeoutRef.current = undefined;
        setErrored(intl.formatMessage(messages.errorMaxPolling));
      } else {
        try {
          const orderToCheck = (await api.user.orders.get({ id: order.id })) as Order;
          const isSigned = !orderNeedsSignature(orderToCheck, product);
          if (isSigned) {
            timeoutRef.current = undefined;
            stepFinished();
          } else {
            round++;
            timeoutRef.current = setTimeout(checkOrderSignature, CONTRACT_SETTINGS.pollInterval);
          }
        } catch (e) {
          setErrored(intl.formatMessage(messages.errorPolling));
        }
      }
    };

    checkOrderSignature();
  };

  const stepFinished = () => {
    setStep(ContractSteps.FINISHED);
    queryClient.invalidateQueries({ queryKey: ['user', 'orders'] });
    onDone();
  };

  const onSignatureError = (e: string) => {
    setErrored(e);
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
    initialize();
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
          <h3 className="ContractFrame__caption">
            <FormattedMessage {...messages.polling} />
          </h3>
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
          <Button onClick={() => onClose()}>
            <FormattedMessage {...messages.finishedButton} />
          </Button>
        </div>
      )}
    </div>
  );
};
