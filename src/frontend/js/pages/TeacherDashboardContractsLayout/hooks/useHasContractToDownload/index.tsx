import { useOrganizationContracts } from 'hooks/useContracts';
import { PER_PAGE } from 'settings';
import { ContractState, Offering, Organization } from 'types/Joanie';

const useHasContractToDownload = (
  organizationId?: Organization['id'],
  offeringId?: Offering['id'],
) => {
  const {
    items: contracts,
    states: { isFetched },
  } = useOrganizationContracts({
    organization_id: organizationId,
    offering_id: offeringId,
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
