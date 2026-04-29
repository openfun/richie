import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { BatchOrderRead } from 'types/Joanie';
import DownloadAgreementButton from 'components/DownloadAgreementButton';
import { DashboardSubItem } from 'widgets/Dashboard/components/DashboardItem/DashboardSubItem';
import { useOrganizationAgreement } from 'hooks/useOrganizationAgreements.tsx';
import useDateFormat from 'hooks/useDateFormat';

const messages = defineMessages({
  title: {
    id: 'batchOrder.agreement.title',
    description: 'Step label for the agreement document in the batch order detail',
    defaultMessage: 'Agreement',
  },
  organizationSignedOn: {
    id: 'batchOrder.agreement.organizationSignedOn',
    description: 'Label displayed once the organization has counter-signed the agreement',
    defaultMessage: 'Signed by the organization on {date}.',
  },
  waitingOrganization: {
    id: 'batchOrder.agreement.waitingOrganization',
    description:
      'Label displayed when the agreement is waiting for the organization counter-signature',
    defaultMessage: 'Waiting for the organization to counter-sign the agreement.',
  },
});

interface BatchOrderAgreementInfoProps {
  batchOrder: BatchOrderRead;
}

export const BatchOrderAgreementInfo = ({ batchOrder }: BatchOrderAgreementInfoProps) => {
  const intl = useIntl();
  const formatDate = useDateFormat();
  const {
    item: agreement,
    states: { isFetched, error },
  } = useOrganizationAgreement(batchOrder.contract_id!, {
    organization_id: batchOrder.organization.id,
  });

  if (!isFetched || error || !agreement) {
    return null;
  }

  const signedOn = agreement.organization_signed_on;

  return (
    <DashboardSubItem
      title={intl.formatMessage(messages.title)}
      footer={
        <div className="content">
          {signedOn ? (
            <>
              <p>
                <FormattedMessage
                  {...messages.organizationSignedOn}
                  values={{ date: formatDate(signedOn) }}
                />
              </p>
              <DownloadAgreementButton
                organizationId={batchOrder.organization.id}
                agreementId={batchOrder.contract_id!}
              />
            </>
          ) : (
            <FormattedMessage {...messages.waitingOrganization} />
          )}
        </div>
      }
    />
  );
};
