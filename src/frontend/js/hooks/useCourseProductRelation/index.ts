import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { API, CourseProductRelation } from 'types/Joanie';
import { ResourcesQuery, useResource, useResources, UseResourcesProps } from 'hooks/useResources';

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useCourseProductRelations.errorGet',
    description:
      'Error message shown to the user when course product relation fetch request fails.',
    defaultMessage: 'An error occurred while fetching trainings. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useCourseProductRelations.errorNotFound',
    description: 'Error message shown to the user when no course product relation matches.',
    defaultMessage: 'Cannot find the training.',
  },
});

/**
 * Joanie Api hook to retrieve/create/update/delete course
 * owned by the authenticated user.
 */
const props: UseResourcesProps<
  CourseProductRelation,
  ResourcesQuery,
  API['courseProductRelations']
> = {
  queryKey: ['courseProductRelations'],
  apiInterface: () => useJoanieApi().courseProductRelations,
  session: true,
  messages,
};

export const useCourseProductRelations = useResources<
  CourseProductRelation,
  ResourcesQuery,
  API['courseProductRelations']
>(props);

export const useCourseProductRelation = useResource<CourseProductRelation>(props);
