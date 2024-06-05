import { Button } from '@openfun/cunningham-react';
import { FormattedMessage, defineMessages } from 'react-intl';
import { useState } from 'react';
import { generatePath } from 'react-router-dom';
import { LearnerContractFrame } from 'components/ContractFrame';
import {
  Contract,
  ContractState,
  CredentialOrder,
  NestedCredentialOrder,
  OrderState,
} from 'types/Joanie';
import { RouterButton } from 'widgets/Dashboard/components/RouterButton';
import DownloadContractButton from 'components/DownloadContractButton';
import { Maybe } from 'types/utils';
import { ContractHelper } from 'utils/ContractHelper';

import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';

const messages = defineMessages({
  contractSignActionLabel: {
    id: 'components.SignContractButton.contractSignActionLabel',
    description: 'Label of "sign contract" action.',
    defaultMessage: 'Sign',
  },
  contractDownloadActionLabel: {
    id: 'components.SignContractButton.contractDownloadActionLabel',
    description: 'Label of "download contract" action.',
    defaultMessage: 'Download',
  },
  contractDownloadError: {
    id: 'components.SignContractButton.contractDownloadError',
    description: "Message displayed when the order's contract download fails.",
    defaultMessage:
      'An error happened while downloading the training contract. Please try again later.',
  },
});

interface SignContractButtonProps {
  order: CredentialOrder | NestedCredentialOrder;
  contract: Maybe<Contract>;
  writable: boolean;
  className?: string;
}

interface SignContractButtonLinkProps {
  orderId: string;
  className?: string;
}

const SignContractButtonLink = ({ orderId, className }: SignContractButtonLinkProps) => {
  return (
    <RouterButton
      size="small"
      href={generatePath(LearnerDashboardPaths.ORDER, {
        orderId,
      })}
      className={className}
    >
      <FormattedMessage {...messages.contractSignActionLabel} />
    </RouterButton>
  );
};

const SignContractButton = ({ order, contract, writable, className }: SignContractButtonProps) => {
  const [contractFrameOpened, setContractFrameOpened] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);
  const contractState = ContractHelper.getState(contract);
  const notReadyToSign =
    order.state !== OrderState.VALIDATED || contractLoading || contractFrameOpened;

  if (!writable && contractState === ContractState.UNSIGNED) {
    return <SignContractButtonLink orderId={order.id} className={className} />;
  }

  return (
    <>
      {contractState === ContractState.SIGNED && (
        <DownloadContractButton contract={contract!} className="dashboard-item__button" />
      )}
      {contractState === ContractState.UNSIGNED && (
        <Button
          size="small"
          className={className}
          onClick={() => setContractFrameOpened(true)}
          disabled={notReadyToSign}
        >
          <FormattedMessage {...messages.contractSignActionLabel} />
        </Button>
      )}

      <LearnerContractFrame
        order={order}
        isOpen={contractFrameOpened}
        onDone={() => {
          // Set the contract in loading mode waiting for order re-fetch that will remove it.
          setContractLoading(true);
        }}
        onClose={() => setContractFrameOpened(false)}
      />
    </>
  );
};

export default SignContractButton;
