import classNames from 'classnames';
import { Organization, Offering } from 'types/Joanie';
import useTeacherAgreementsToSign from './hooks/useTeacherAgreementsToSign';
import SignOrganizationAgreementButton from './SignOrganizationAgreementButton';
import BulkDownloadAgreementButton from './BulkAgreementContractButton';
import useHasAgreementToDownload from './hooks/useHasAgreementToDownload';

interface AgreementActionsProps {
  organizationId: Organization['id'];
  offeringId?: Offering['id'];
}

const AgreementActionsBar = ({ organizationId, offeringId }: AgreementActionsProps) => {
  const { canSignAgreements, agreementToSignCount } = useTeacherAgreementsToSign({
    organizationId,
    offeringId,
  });
  const hasContractToDownload = useHasAgreementToDownload(organizationId, offeringId);

  const nbAvailableActions = [canSignAgreements, hasContractToDownload].filter((val) => val).length;
  const offeringIds = offeringId ? [offeringId] : undefined;

  return (
    nbAvailableActions > 0 && (
      <div
        className={classNames('dashboard__page__actions-row', {
          'dashboard__page__actions-row--space-between': nbAvailableActions > 1,
          'dashboard__page__actions-row--end': nbAvailableActions === 1,
        })}
        data-testid="teacher-contracts-list-actionsBar"
      >
        {canSignAgreements && (
          <div>
            <SignOrganizationAgreementButton
              offeringIds={offeringIds}
              organizationId={organizationId}
              agreementToSignCount={agreementToSignCount}
            />
          </div>
        )}
        {hasContractToDownload && (
          <BulkDownloadAgreementButton organizationId={organizationId} offeringId={offeringId} />
        )}
      </div>
    )
  );
};

export default AgreementActionsBar;
