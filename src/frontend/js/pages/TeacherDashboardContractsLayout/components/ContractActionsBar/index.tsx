import classNames from 'classnames';
import { Organization, Offer } from 'types/Joanie';
import useTeacherContractsToSign from 'pages/TeacherDashboardContractsLayout/hooks/useTeacherContractsToSign';
import useHasContractToDownload from 'pages/TeacherDashboardContractsLayout/hooks/useHasContractToDownload';
import SignOrganizationContractButton from '../SignOrganizationContractButton';
import BulkDownloadContractButton from '../BulkDownloadContractButton';

interface ContractActionsProps {
  organizationId: Organization['id'];
  offerId?: Offer['id'];
}

const ContractActionsBar = ({ organizationId, offerId }: ContractActionsProps) => {
  const { canSignContracts, contractsToSignCount } = useTeacherContractsToSign({
    organizationId,
    offerId,
  });
  const hasContractToDownload = useHasContractToDownload(organizationId, offerId);

  const nbAvailableActions = [canSignContracts, hasContractToDownload].filter((val) => val).length;
  const offerIds = offerId ? [offerId] : undefined;
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
              offerIds={offerIds}
              organizationId={organizationId}
              contractToSignCount={contractsToSignCount}
            />
          </div>
        )}
        {hasContractToDownload && (
          <BulkDownloadContractButton organizationId={organizationId} offerId={offerId} />
        )}
      </div>
    )
  );
};

export default ContractActionsBar;
