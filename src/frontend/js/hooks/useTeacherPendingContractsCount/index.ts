import { useMemo } from 'react';
import { useOrganizationContracts } from 'hooks/useContracts';
import { useCourseProductRelation } from 'hooks/useCourseProductRelation';
import { PER_PAGE } from 'settings';
import { ContractState, CourseProductRelation, Organization } from 'types/Joanie';

interface UseTeacherPendingContractsCountProps {
  organizationId?: Organization['id'];
  courseProductRelationId?: CourseProductRelation['id'];
}

const useTeacherPendingContractsCount = ({
  organizationId,
  courseProductRelationId,
}: UseTeacherPendingContractsCountProps) => {
  const {
    item: training,
    states: { isFetched: isTrainingFetched },
  } = useCourseProductRelation(courseProductRelationId, {
    organization_id: organizationId,
  });

  const isActive = useMemo(() => {
    return !!(organizationId && (!courseProductRelationId || isTrainingFetched));
  }, [organizationId, courseProductRelationId, isTrainingFetched]);

  const { items: contracts, meta } = useOrganizationContracts(
    {
      organization_id: organizationId,
      course_id: training?.course.id,
      product_id: training?.product.id,
      signature_state: ContractState.LEARNER_SIGNED,
      page: 1,
      page_size: PER_PAGE.teacherContractList,
    },
    { enabled: isActive },
  );

  if (isActive) {
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
