import { useOrganizationAgreements } from 'hooks/useOrganizationAgreements.tsx';
import { PER_PAGE } from 'settings';
import { ContractState, Offering, Organization } from 'types/Joanie';

const useHasAgreementToDownload = (
  organizationId?: Organization['id'],
  offeringId?: Offering['id'],
) => {
  const {
    items: agreements,
    states: { isFetched },
  } = useOrganizationAgreements({
    organization_id: organizationId,
    offering_id: offeringId,
    signature_state: ContractState.SIGNED,
    page: 1,
    page_size: PER_PAGE.teacherContractList,
  });

  if (!isFetched) {
    return null;
  }

  return agreements.length > 0;
};

export default useHasAgreementToDownload;
