import { useOrganizationAgreements } from 'hooks/useOrganizationAgreements.tsx';
import { PER_PAGE } from 'settings';
import { ContractState, Offering, Organization } from 'types/Joanie';

interface UseTeacherPendingContractsCountProps {
  organizationId?: Organization['id'];
  offeringId?: Offering['id'];
}

const useTeacherPendingAgreementsCount = ({
  organizationId,
  offeringId,
}: UseTeacherPendingContractsCountProps) => {
  const { items: agreements, meta } = useOrganizationAgreements({
    organization_id: organizationId,
    offering_id: offeringId,
    signature_state: ContractState.LEARNER_SIGNED,
    page: 1,
    page_size: PER_PAGE.teacherContractList,
  });

  if (organizationId) {
    return {
      agreements,
      pendingAgreementCount: meta?.pagination?.count ?? 0,
    };
  }
  return {
    agreements: [],
    pendingAgreementCount: 0,
  };
};

export default useTeacherPendingAgreementsCount;
