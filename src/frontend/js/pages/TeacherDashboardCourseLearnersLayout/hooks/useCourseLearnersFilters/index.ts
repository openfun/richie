import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  CourseListItem,
  CourseOrderResourceQuery,
  CourseProductRelation,
  Organization,
} from 'types/Joanie';

export type CourseLearnersParams = {
  courseId: CourseListItem['id'];
  courseProductRelationId?: CourseProductRelation['id'];
  organizationId?: Organization['id'];
};

const useCourseLearnersFilters = () => {
  const { courseId, courseProductRelationId, organizationId } = useParams<CourseLearnersParams>();
  const [searchParams] = useSearchParams();
  const searchFilters: CourseOrderResourceQuery = useMemo(() => {
    return {
      course_id: courseId,
      organization_id: searchParams.get('organization_id') || undefined,
      course_product_relation_id: searchParams.get('course_product_relation_id') || undefined,
    };
  }, Array.from(searchParams.entries()));

  const initialFilters = useMemo(() => {
    return {
      ...searchFilters,
      organization_id: organizationId || searchFilters.organization_id,
      course_product_relation_id: courseProductRelationId,
    };
  }, []);
  const [filters, setFilters] = useState<CourseOrderResourceQuery>(initialFilters);

  // update current filter with initial value when it's ready
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return { initialFilters, filters, setFilters };
};

export default useCourseLearnersFilters;
