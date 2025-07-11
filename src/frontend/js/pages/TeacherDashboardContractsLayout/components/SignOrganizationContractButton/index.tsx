import { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { OrganizationContractFrame } from 'components/ContractFrame';

import { Offering, Organization } from 'types/Joanie';

const messages = defineMessages({
  signAllPendingContracts: {
    defaultMessage: 'Sign all pending contracts ({ count })',
    description: 'Button to sign all pending contracts',
    id: 'pages.TeacherDashboardOrganizationContractsLayout.signAllPendingContracts',
  },
});

interface Props {
  offeringIds?: Offering['id'][];
  organizationId: Organization['id'];
  contractToSignCount: number;
}

const SignOrganizationContractButton = ({
  organizationId,
  contractToSignCount,
  offeringIds = [],
}: Props) => {
  const [contractFrameOpened, setContractFrameOpened] = useState(false);
  const hasContractToSign = contractToSignCount > 0;

  return (
    <>
      {hasContractToSign && (
        <Button
          size="small"
          color="primary"
          onClick={() => setContractFrameOpened(true)}
          disabled={contractFrameOpened}
          icon={
            <span className="material-icons" aria-hidden={true}>
              edit
            </span>
          }
        >
          <FormattedMessage
            {...messages.signAllPendingContracts}
            values={{ count: contractToSignCount }}
          />
        </Button>
      )}
      <OrganizationContractFrame
        offeringIds={offeringIds}
        organizationId={organizationId}
        isOpen={contractFrameOpened}
        onClose={() => setContractFrameOpened(false)}
      />
    </>
  );
};

export default SignOrganizationContractButton;
