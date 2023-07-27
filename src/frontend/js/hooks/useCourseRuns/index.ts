import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { API, CourseRun, CourseRunFilters } from 'types/Joanie';
import { useResource, useResources, UseResourcesProps } from 'hooks/useResources';

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useCourseRuns.errorGet',
    description: 'Error message shown to the user when course runs fetch request fails.',
    defaultMessage: 'An error occurred while fetching course runs. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useCourseRuns.errorNotFound',
    description: 'Error message shown to the user when no course runs matches.',
    defaultMessage: 'Cannot find the course runs.',
  },
});

/**
 * Joanie Api hook to retrieve course runs
 * owned by the authenticated user.
 */
const props: UseResourcesProps<CourseRun, CourseRunFilters, API['courseRuns']> = {
  queryKey: ['courseRuns'],
  apiInterface: () => useJoanieApi().courseRuns,
  session: true,
  messages,
};

export const useCourseRuns = useResources(props);
export const useCourseRun = useResource<CourseRun>(props);
