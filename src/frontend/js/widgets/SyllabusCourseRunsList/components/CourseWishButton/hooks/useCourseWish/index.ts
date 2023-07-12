import { defineMessages } from 'react-intl';
import { API, CourseWish } from 'types/Joanie';
import { ResourcesQuery, useResource, UseResourcesProps } from 'hooks/useResources';
import { useJoanieApi } from 'contexts/JoanieApiContext';

interface CourseWishFilters extends ResourcesQuery {
  course_code?: string;
}

const messages = defineMessages({
  errorGet: {
    id: 'hooks.useWishlist.errorGet',
    description: 'Error message shown to the user when wishlist fetch request fails.',
    defaultMessage: 'An error occurred while fetching wishlist. Please retry later.',
  },
  errorNotFound: {
    id: 'hooks.useWishlist.errorNotFound',
    description: 'Error message shown to the user when no wishlist matches.',
    defaultMessage: 'Cannot find the wishlist.',
  },
  errorDelete: {
    id: 'hooks.useWishlist.errorDelete',
    description: 'Error message shown to the user when wishlist deletion request fails.',
    defaultMessage:
      'An error occurred when removing this course from your wishlist. Please retry later.',
  },
  errorCreate: {
    id: 'hooks.useWishlist.errorCreate',
    description: 'Error message shown to the user when wishlist creation request fails.',
    defaultMessage:
      'An error occurred when adding this course to your wishlist. Please retry later.',
  },
});

/**
 * Joanie Api hook to retrieve a wishlist product through its id.
 */
const props: UseResourcesProps<CourseWish, CourseWishFilters, API['user']['wish']> = {
  queryKey: ['wishlist_course'],
  apiInterface: () => useJoanieApi().user.wish,
  session: true,
  messages,
};

export const useCourseWish = useResource<CourseWish, CourseWishFilters>(props);
