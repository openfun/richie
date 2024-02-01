import classNames from 'classnames';
import { Organization, CourseProductRelation } from 'types/Joanie';
import useTeacherContractsToSign from 'pages/TeacherDashboardContractsLayout/hooks/useTeacherContractsToSign';
import useHasContractToDownload from 'pages/TeacherDashboardContractsLayout/hooks/useHasContractToDownload';
import SignOrganizationContractButton from '../SignOrganizationContractButton';
import BulkDownloadContractButton from '../BulkDownloadContractButton';

interface ContractActionsProps {
  organizationId: Organization['id'];
  courseProductRelationId?: CourseProductRelation['id'];
}

const ContractActionsBar = ({ organizationId, courseProductRelationId }: ContractActionsProps) => {
  const { canSignContracts, contractsToSignCount } = useTeacherContractsToSign({
    organizationId,
    courseProductRelationId,
  });
  const hasContractToDownload = useHasContractToDownload(organizationId, courseProductRelationId);

  const canDownloadContracts = hasContractToDownload && !courseProductRelationId;
  const nbAvailableActions = [canSignContracts, canDownloadContracts].filter((val) => val).length;
  const courseProductRelationIds = courseProductRelationId ? [courseProductRelationId] : undefined;
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
              courseProductRelationIds={courseProductRelationIds}
              organizationId={organizationId}
              contractToSignCount={contractsToSignCount}
            />
          </div>
        )}
        {canDownloadContracts && <BulkDownloadContractButton organizationId={organizationId} />}
      </div>
    )
  );
};

export default ContractActionsBar;
