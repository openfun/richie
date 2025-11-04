import { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Button } from '@openfun/cunningham-react';

import { Offering, Organization } from 'types/Joanie';
import OrganizationAgreementFrame from './OrganizationAgreementFrame';

const messages = defineMessages({
  signAllPendingAgreements: {
    defaultMessage: 'Sign all pending agreements ({ count })',
    description: 'Button to sign all pending agreements',
    id: 'pages.TeacherDashboardOrganizationAgreementsLayout.signAllPendingAgreements',
  },
});

interface Props {
  offeringIds?: Offering['id'][];
  organizationId: Organization['id'];
  agreementToSignCount: number;
}

const SignOrganizationAgreementButton = ({
  organizationId,
  agreementToSignCount,
  offeringIds = [],
}: Props) => {
  const [agreementFrameOpened, setAgreementFrameOpened] = useState(false);
  const hasAgreementToSign = agreementToSignCount > 0;

  return (
    <>
      {hasAgreementToSign && (
        <Button
          size="small"
          color="primary"
          onClick={() => setAgreementFrameOpened(true)}
          disabled={agreementFrameOpened}
          icon={
            <span className="material-icons" aria-hidden={true}>
              edit
            </span>
          }
        >
          <FormattedMessage
            {...messages.signAllPendingAgreements}
            values={{ count: agreementToSignCount }}
          />
        </Button>
      )}
      <OrganizationAgreementFrame
        offeringIds={offeringIds}
        organizationId={organizationId}
        isOpen={agreementFrameOpened}
        onClose={() => setAgreementFrameOpened(false)}
      />
    </>
  );
};

export default SignOrganizationAgreementButton;
