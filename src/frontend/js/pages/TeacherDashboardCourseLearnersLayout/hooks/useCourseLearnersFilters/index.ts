import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import useDefaultOrganizationId from 'hooks/useDefaultOrganizationId';
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
  const { courseId, courseProductRelationId } = useParams<CourseLearnersParams>();
  const [searchParams] = useSearchParams();
  const searchFilters: CourseOrderResourceQuery = useMemo(() => {
    return {
      course_id: courseId,
      organization_id: searchParams.get('organization_id') || undefined,
      course_product_relation_id: searchParams.get('course_product_relation_id') || undefined,
    };
  }, Array.from(searchParams.entries()));

  // default organizationId between (ordered by priority): route, query, first user's organization.
  const defaultOrganizationId = useDefaultOrganizationId();

  const initialFilters = useMemo(() => {
    return {
      ...searchFilters,
      organization_id: defaultOrganizationId,
      course_product_relation_id: courseProductRelationId,
    };
  }, [defaultOrganizationId]);
  const [filters, setFilters] = useState<CourseOrderResourceQuery>(initialFilters);

  // update current filter with initial value when it's ready
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  return { initialFilters, filters, setFilters };
};

export default useCourseLearnersFilters;
