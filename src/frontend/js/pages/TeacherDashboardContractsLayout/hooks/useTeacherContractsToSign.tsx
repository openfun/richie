import useContractAbilities from 'hooks/useContractAbilities';
import { useOrganizationContracts } from 'hooks/useContracts';
import { ContractState, Organization, Offer } from 'types/Joanie';
import { ContractActions } from 'utils/AbilitiesHelper/types';

interface UseTeacherContractsToSignProps {
  organizationId?: Organization['id'];
  offerId?: Offer['id'];
}

const useTeacherContractsToSign = ({ organizationId, offerId }: UseTeacherContractsToSignProps) => {
  const { items: contractsToSign, meta: contractsToSignMeta } = useOrganizationContracts(
    {
      signature_state: ContractState.LEARNER_SIGNED,
      organization_id: organizationId,
      offer_id: offerId,
    },
    { enabled: !!organizationId },
  );
  const contractAbilities = useContractAbilities(contractsToSign);
  const contractsToSignCount = contractsToSignMeta?.pagination?.count ?? 0;

  return {
    canSignContracts: organizationId && contractAbilities.can(ContractActions.SIGN),
    contractsToSignCount,
  };
};

export default useTeacherContractsToSign;
