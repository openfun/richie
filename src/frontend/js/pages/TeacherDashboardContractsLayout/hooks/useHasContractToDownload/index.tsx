import { useOrganizationContracts } from 'hooks/useContracts';
import { PER_PAGE } from 'settings';
import { ContractState, CourseProductRelation, Organization } from 'types/Joanie';

const useHasContractToDownload = (
  organizationId: Organization['id'],
  courseProductRelationId?: CourseProductRelation['id'],
) => {
  const {
    items: contracts,
    states: { isFetched },
  } = useOrganizationContracts({
    organization_id: organizationId,
    course_product_relation_id: courseProductRelationId,
    signature_state: ContractState.SIGNED,
    page: 1,
    page_size: PER_PAGE.teacherContractList,
  });

  if (!isFetched) {
    return null;
  }

  return contracts.length > 0;
};

export default useHasContractToDownload;
