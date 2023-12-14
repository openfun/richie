import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { API, CourseListItem, CourseQueryFilters } from 'types/Joanie';
import { useResource, useResources, UseResourcesProps } from 'hooks/useResources';

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useCourses.errorSelect',
    description: 'Error message shown to the user when course fetch request fails.',
    defaultMessage: 'An error occurred while fetching course. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useCourses.errorNotFound',
    description: 'Error message shown to the user when not course matches.',
    defaultMessage: 'Cannot find the course.',
  },
});

/**
 * Joanie Api hook to retrieve course
 * owned by the authenticated user.
 */
const props: UseResourcesProps<CourseListItem, CourseQueryFilters, API['courses']> = {
  queryKey: ['courses'],
  apiInterface: () => useJoanieApi().courses,
  session: true,
  messages,
};

export const useCourses = useResources<CourseListItem, CourseQueryFilters>(props);
export const useCourse = useResource<CourseListItem, CourseQueryFilters>(props);
