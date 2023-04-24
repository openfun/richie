import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { CourseListItemMock } from 'api/mocks/joanie/courses';
import { API, CourseFilters } from 'types/Joanie';
import { useResources, UseResourcesProps } from 'hooks/useResources';

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

export enum CourseStatusFilter {
  ALL = 'all',
  INCOMING = 'incoming',
  ONGOING = 'ongoing',
  ARCHIVED = 'archived',
}

export enum CourseTypeFilter {
  ALL = 'all',
  SESSION = 'session',
  MIRCO_CREDENTIAL = 'micro_credential',
}

export interface TeacherCourseSearchFilters {
  status: CourseStatusFilter;
  type: CourseTypeFilter;
  perPage?: number;
}

/**
 * Joanie Api hook to retrieve/create/update/delete course
 * owned by the authenticated user.
 */
const props: UseResourcesProps<CourseListItemMock, CourseFilters, API['courses']> = {
  queryKey: ['courses'],
  apiInterface: () => useJoanieApi().courses,
  session: true,
  messages,
};

const filtersToApiFilters = (
  filters: TeacherCourseSearchFilters = {
    status: CourseStatusFilter.ALL,
    type: CourseTypeFilter.ALL,
  },
): CourseFilters => {
  const apiFilters: CourseFilters = {
    status: filters.status,
    type: filters.type,
  };
  if (filters.perPage) {
    apiFilters.per_page = filters.perPage;
  }
  return apiFilters;
};

export const useCourses = (filters?: TeacherCourseSearchFilters) => {
  const apiFilters: CourseFilters = filtersToApiFilters(filters);
  return useResources<CourseListItemMock, CourseFilters, API['courses']>(props)(apiFilters);
};
