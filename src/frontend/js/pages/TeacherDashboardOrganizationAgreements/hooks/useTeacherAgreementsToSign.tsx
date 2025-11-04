import { useOrganizationAgreements } from 'hooks/useOrganizationAgreements.tsx';
import { ContractState, Organization, Offering } from 'types/Joanie';
import { ContractActions } from 'utils/AbilitiesHelper/types';
import useAgreementAbilities from './useAgreementsAbilities';

interface UseTeacherAgreementsToSignProps {
  organizationId?: Organization['id'];
  offeringId?: Offering['id'];
}

const useTeacherAgreementsToSign = ({
  organizationId,
  offeringId,
}: UseTeacherAgreementsToSignProps) => {
  const { items: agreementsToSign, meta: agreementsToSignMeta } = useOrganizationAgreements(
    {
      signature_state: ContractState.LEARNER_SIGNED,
      organization_id: organizationId,
      offering_id: offeringId,
    },
    { enabled: !!organizationId },
  );
  const agreementAbilities = useAgreementAbilities(agreementsToSign);
  const agreementToSignCount = agreementsToSignMeta?.pagination?.count ?? 0;

  return {
    canSignAgreements: organizationId && agreementAbilities.can(ContractActions.SIGN),
    agreementToSignCount,
  };
};

export default useTeacherAgreementsToSign;
