import { CourseListItem, Organization, Product } from 'types/Joanie';
import useOrganizationContractsToSign from 'pages/TeacherDashboardContractsLayout/hooks/useTeacherContractsToSign';
import SignOrganizationContractButton from '../SignOrganizationContractButton';

interface ContractActionsProps {
  courseId?: CourseListItem['id'];
  productId?: Product['id'];
  organizationId: Organization['id'];
}

const ContractActionsBar = ({ courseId, productId, organizationId }: ContractActionsProps) => {
  const { canSignContracts, contractsToSignCount } = useOrganizationContractsToSign({
    organizationId,
    courseId,
    productId,
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
