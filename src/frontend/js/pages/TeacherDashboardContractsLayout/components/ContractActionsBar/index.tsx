import classNames from 'classnames';
import { Organization, Offering } from 'types/Joanie';
import useTeacherContractsToSign from 'pages/TeacherDashboardContractsLayout/hooks/useTeacherContractsToSign';
import useHasContractToDownload from 'pages/TeacherDashboardContractsLayout/hooks/useHasContractToDownload';
import SignOrganizationContractButton from '../SignOrganizationContractButton';
import BulkDownloadContractButton from '../BulkDownloadContractButton';

interface ContractActionsProps {
  organizationId: Organization['id'];
  offeringId?: Offering['id'];
}

const ContractActionsBar = ({ organizationId, offeringId }: ContractActionsProps) => {
  const { canSignContracts, contractsToSignCount } = useTeacherContractsToSign({
    organizationId,
    offeringId,
  });
  const hasContractToDownload = useHasContractToDownload(organizationId, offeringId);

  const nbAvailableActions = [canSignContracts, hasContractToDownload].filter((val) => val).length;
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
        {canSignContracts && (
          <div>
            <SignOrganizationContractButton
              offeringIds={offeringIds}
              organizationId={organizationId}
              contractToSignCount={contractsToSignCount}
            />
          </div>
        )}
        {hasContractToDownload && (
          <BulkDownloadContractButton organizationId={organizationId} offeringId={offeringId} />
        )}
      </div>
    )
  );
};

export default ContractActionsBar;
