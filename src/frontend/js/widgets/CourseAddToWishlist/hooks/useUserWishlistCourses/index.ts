import { defineMessages } from 'react-intl';
import { API, UserWishlistCourse } from 'types/Joanie';
import {
  QueryOptions,
  useResource,
  useResourcesCustom,
  UseResourcesProps,
} from 'hooks/useResources';
import { useJoanieApi } from 'contexts/JoanieApiContext';

interface UserWishlistCoursesFilters {
  id?: string;
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
      'An error occurred when removing this course to your wishlist. Please retry later.',
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
const props: UseResourcesProps<
  UserWishlistCourse,
  UserWishlistCoursesFilters,
  API['user']['wishlist']
> = {
  queryKey: ['wishlist_course'],
  apiInterface: () => useJoanieApi().user.wishlist,
  session: true,
  messages,
};

export const useUserWishlistCourses = (
  filters?: UserWishlistCoursesFilters,
  queryOptions?: QueryOptions<UserWishlistCourse>,
) =>
  useResourcesCustom<UserWishlistCourse, UserWishlistCoursesFilters>({
    ...props,
    filters,
    queryOptions,
  });
export const useUserWishlistCourse = useResource<UserWishlistCourse, UserWishlistCoursesFilters>(
  props,
);
