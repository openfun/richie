import { Organization, CourseProductRelation } from 'types/Joanie';
import useTeacherContractsToSign from 'pages/TeacherDashboardContractsLayout/hooks/useTeacherContractsToSign';
import SignOrganizationContractButton from '../SignOrganizationContractButton';

interface ContractActionsProps {
  organizationId: Organization['id'];
  courseProductRelationId?: CourseProductRelation['id'];
}

const ContractActionsBar = ({ organizationId, courseProductRelationId }: ContractActionsProps) => {
  const { canSignContracts, contractsToSignCount } = useTeacherContractsToSign({
    organizationId,
    courseProductRelationId,
  });
  return (
    canSignContracts && (
      <div className="dashboard__page__actions-row dashboard__page__actions-row--space-between">
        <div>
          <SignOrganizationContractButton
            organizationId={organizationId}
            contractToSignCount={contractsToSignCount}
          />
        </div>
      </div>
    )
  );
};

export default ContractActionsBar;
