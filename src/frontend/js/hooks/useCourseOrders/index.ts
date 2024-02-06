import { defineMessages } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { useResource, useResources, UseResourcesProps } from 'hooks/useResources';
import { API, CourseOrderResourceQuery, NestedCourseOrder } from 'types/Joanie';

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useCourseOrders.errorSelect',
    description: 'Error message shown to the user when course orders fetch request fails.',
    defaultMessage: 'An error occurred while fetching courses orders. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useCourseOrders.errorNotFound',
    description: 'Error message shown to the user when no course order matches.',
    defaultMessage: 'Cannot find the course orders',
  },
});

const props: UseResourcesProps<
  NestedCourseOrder,
  CourseOrderResourceQuery,
  API['courses']['orders']
> = {
  queryKey: ['courses', 'orders'],
  apiInterface: () => useJoanieApi().courses.orders,
  session: true,
  messages,
};

/**
 * Joanie Api hook to retrieve/update a contract owned by the authenticated user.
 */
export const useCourseOrder = useResource(props);
export const useCourseOrders = useResources(props);
