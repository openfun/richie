import { useOrganizationContracts } from 'hooks/useContracts';
import { PER_PAGE } from 'settings';
import { ContractState, Offer, Organization } from 'types/Joanie';

const useHasContractToDownload = (organizationId?: Organization['id'], offerId?: Offer['id']) => {
  const {
    items: contracts,
    states: { isFetched },
  } = useOrganizationContracts({
    organization_id: organizationId,
    offer_id: offerId,
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
