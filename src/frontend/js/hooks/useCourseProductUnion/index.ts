import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import {
  CourseListItem,
  Product,
  PaginatedResourceQuery,
  CourseProductRelation,
} from 'types/Joanie';
import useUnionResource, { ResourceUnionPaginationProps } from 'hooks/useUnionResource';
import { PER_PAGE } from 'settings';

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

export const useCourseProductUnion = ({
  perPage = PER_PAGE.useCourseProductUnion,
}: ResourceUnionPaginationProps = {}) => {
  const api = useJoanieApi();
  return useUnionResource<
    CourseListItem,
    CourseProductRelation,
    PaginatedResourceQuery,
    PaginatedResourceQuery
  >({
    queryAConfig: {
      queryKey: ['user', 'courses'],
      fn: api.courses.get,
      filters: {},
    },
    queryBConfig: {
      queryKey: ['user', 'course_product_relations'],
      fn: api.courseProductRelations.get,
      filters: {},
    },
    perPage,
    errorGetMessage: messages.errorGet,
  });
};
