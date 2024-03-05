import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import {
  CourseListItem,
  Product,
  CourseProductRelation,
  CourseQueryFilters,
  CourseProductRelationQueryFilters,
  ProductType,
} from 'types/Joanie';
import useUnionResource, { ResourceUnionPaginationProps } from 'hooks/useUnionResource';

export const isCourseListItem = (obj: CourseListItem | Product): obj is CourseListItem => {
  return 'course_runs' in obj;
};
export const isProduct = (obj: CourseListItem | Product): obj is Product => {
  return 'certificate_definition' in obj;
};

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useCourseProductUnion.errorGet',
    description: 'Error message shown to the user when trainings fetch request fails.',
    defaultMessage: 'An error occurred while fetching trainings. Please retry later.',
  },
});

interface UseCourseProductUnionProps extends ResourceUnionPaginationProps {
  organizationId?: string;
  productType?: ProductType;
  query?: string;
}

export const useCourseProductUnion = ({
  perPage = 50,
  organizationId,
  productType,
  query,
}: UseCourseProductUnionProps = {}) => {
  const api = useJoanieApi();
  return useUnionResource<
    CourseListItem,
    CourseProductRelation,
    CourseQueryFilters,
    CourseProductRelationQueryFilters
  >({
    queryAConfig: {
      queryKey: ['user', 'courses'],
      fn: api.courses.get,
      filters: { query, organization_id: organizationId, has_listed_course_runs: true },
    },
    queryBConfig: {
      queryKey: ['user', 'course_product_relations'],
      fn: api.courseProductRelations.get,
      filters: { query, organization_id: organizationId, product_type: productType },
    },
    perPage,
    errorGetMessage: messages.errorGet,
    refetchOnInvalidation: false,
  });
};
