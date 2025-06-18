import { useOrganizationContracts } from 'hooks/useContracts';
import { PER_PAGE } from 'settings';
import { ContractState, Offer, Organization } from 'types/Joanie';

interface UseTeacherPendingContractsCountProps {
  organizationId?: Organization['id'];
  offerId?: Offer['id'];
}

const useTeacherPendingContractsCount = ({
  organizationId,
  offerId,
}: UseTeacherPendingContractsCountProps) => {
  const { items: contracts, meta } = useOrganizationContracts({
    organization_id: organizationId,
    offer_id: offerId,
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
