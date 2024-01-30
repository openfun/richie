import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ContractResourceQuery, ContractState } from 'types/Joanie';

export type TeacherDashboardContractsParams = {
  organizationId?: string;
  courseProductRelationId?: string;
};

const useTeacherContractFilters = () => {
  const { organizationId, courseProductRelationId } = useParams<TeacherDashboardContractsParams>();
  const [searchParams] = useSearchParams();

  const initialFilters = useMemo(
    () => ({
      signature_state:
        (searchParams.get('signature_state') as ContractState) || ContractState.SIGNED,
      organization_id: organizationId,
      course_product_relation_id: courseProductRelationId,
    }),
    [],
  );
  const [filters, setFilters] = useState<ContractResourceQuery>(initialFilters);

  return { initialFilters, filters, setFilters };
};

export default useTeacherContractFilters;
