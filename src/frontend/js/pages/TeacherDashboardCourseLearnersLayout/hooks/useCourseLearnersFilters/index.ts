import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import useDefaultOrganizationId from 'hooks/useDefaultOrganizationId';
import { CourseListItem, CourseOrderResourceQuery, Offering, Organization } from 'types/Joanie';

export type CourseLearnersParams = {
  courseId: CourseListItem['id'];
  offeringId?: Offering['id'];
  organizationId?: Organization['id'];
};

const useCourseLearnersFilters = () => {
  const { courseId, offeringId } = useParams<CourseLearnersParams>();
  const [searchParams] = useSearchParams();
  const searchFilters: CourseOrderResourceQuery = useMemo(() => {
    return {
      course_id: courseId,
      organization_id: searchParams.get('organization_id') || undefined,
      offering_id: searchParams.get('offering_id') || undefined,
    };
  }, Array.from(searchParams.entries()));

  // default organizationId between (ordered by priority): route, query, first user's organization.
  const defaultOrganizationId = useDefaultOrganizationId();

  const initialFilters = useMemo(() => {
    return {
      ...searchFilters,
      organization_id: defaultOrganizationId,
      offering_id: offeringId,
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
