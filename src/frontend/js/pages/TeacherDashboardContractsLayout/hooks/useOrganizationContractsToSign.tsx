import useContractAbilities from 'hooks/useContractAbilities';
import { useOrganizationContracts } from 'hooks/useContracts';
import { ContractState, CourseListItem, Organization, Product } from 'types/Joanie';
import { ContractActions } from 'utils/AbilitiesHelper/types';

interface UseOrganizationContractsToSignProps {
  courseId?: CourseListItem['id'];
  productId?: Product['id'];
  organizationId?: Organization['id'];
}

const useOrganizationContractsToSign = ({
  courseId,
  productId,
  organizationId,
}: UseOrganizationContractsToSignProps) => {
  const { items: contractsToSign, meta: contractsToSignMeta } = useOrganizationContracts(
    {
      signature_state: ContractState.LEARNER_SIGNED,
      organization_id: organizationId,
      course_id: courseId,
      product_id: productId,
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

export default useOrganizationContractsToSign;
