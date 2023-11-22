import { Button } from '@openfun/cunningham-react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { useState } from 'react';
import { ContractFrame } from 'components/ContractFrame';
import { CredentialOrder, NestedCredentialOrder } from 'types/Joanie';
import { RouterButton } from 'widgets/Dashboard/components/RouterButton';
import { getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';

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
  writable: boolean;
  className?: string;
}

interface SignContractButtonLinkProps {
  orderId: string;
  className?: string;
}

const SignContractButtonLink = ({ orderId, className }: SignContractButtonLinkProps) => {
  const getRoutePath = getDashboardRoutePath(useIntl());
  return (
    <RouterButton
      color="outline-primary"
      href={getRoutePath(LearnerDashboardPaths.ORDER, {
        orderId,
      })}
      className={className}
    >
      <FormattedMessage {...messages.contractSignActionLabel} />
    </RouterButton>
  );
};

const SignContractButton = ({ order, writable, className }: SignContractButtonProps) => {
  const [contractFrameOpened, setContractFrameOpened] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);

  if (!writable) {
    return <SignContractButtonLink orderId={order.id} className={className} />;
  }

  return (
    <>
      <Button
        className={className}
        onClick={() => setContractFrameOpened(true)}
        disabled={contractLoading || contractFrameOpened}
      >
        <FormattedMessage {...messages.contractSignActionLabel} />
      </Button>

      <ContractFrame
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
