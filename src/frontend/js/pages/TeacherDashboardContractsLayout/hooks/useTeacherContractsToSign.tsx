import useContractAbilities from 'hooks/useContractAbilities';
import { useContracts } from 'hooks/useContracts';
import { ContractState, CourseListItem, Organization, Product } from 'types/Joanie';
import { ContractActions } from 'utils/AbilitiesHelper/types';

interface UseTeacherContractsToSignProps {
  courseId?: CourseListItem['id'];
  productId?: Product['id'];
  organizationId?: Organization['id'];
}

const useTeacherContractsToSign = ({
  courseId,
  productId,
  organizationId,
}: UseTeacherContractsToSignProps) => {
  const { items: contractsToSign, meta: contractsToSignMeta } = useContracts(
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

export default useTeacherContractsToSign;
