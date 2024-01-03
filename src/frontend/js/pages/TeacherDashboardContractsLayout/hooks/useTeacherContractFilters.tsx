import { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ContractFilters, ContractState } from 'types/Joanie';

export type TeacherDashboardContractsParams = {
  organizationId?: string;
  courseId?: string;
  productId?: string;
};

const useTeacherContractFilters = () => {
  const { courseId, organizationId, productId } = useParams<TeacherDashboardContractsParams>();
  const [searchParams] = useSearchParams();

  const initialFilters = useMemo(
    () => ({
      signature_state:
        (searchParams.get('signature_state') as ContractState) || ContractState.SIGNED,
      organization_id: organizationId,
      course_id: courseId,
      product_id: productId,
    }),
    [],
  );
  const [filters, setFilters] = useState<ContractFilters>(initialFilters);

  return { initialFilters, filters, setFilters };
};

export default useTeacherContractFilters;
