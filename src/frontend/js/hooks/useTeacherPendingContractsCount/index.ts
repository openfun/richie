import { useOrganizationContracts } from 'hooks/useContracts';
import { PER_PAGE } from 'settings';
import { ContractState, Offering, Organization } from 'types/Joanie';

interface UseTeacherPendingContractsCountProps {
  organizationId?: Organization['id'];
  offeringId?: Offering['id'];
}

const useTeacherPendingContractsCount = ({
  organizationId,
  offeringId,
}: UseTeacherPendingContractsCountProps) => {
  const { items: contracts, meta } = useOrganizationContracts({
    organization_id: organizationId,
    offering_id: offeringId,
    signature_state: ContractState.LEARNER_SIGNED,
    page: 1,
    page_size: PER_PAGE.teacherContractList,
  });

  if (organizationId) {
    return {
      contracts,
      pendingContractCount: meta?.pagination?.count ?? 0,
    };
  }
  return {
    contracts: [],
    pendingContractCount: 0,
  };
};

export default useTeacherPendingContractsCount;
