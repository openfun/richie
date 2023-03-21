import { useMemo } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import type * as Joanie from 'types/Joanie';
import { Button } from 'components/Button';
import { Spinner } from 'components/Spinner';
import { useSession } from 'contexts/SessionContext';
import { useUserWishlistCourses } from './hooks/useUserWishlistCourses';

const messages = defineMessages({
  labelAdd: {
    id: 'components.CourseAddToWishlist.labelAdd',
    description: 'Label to proceed to add a course to user wishlist.',
    defaultMessage: 'Notify me',
  },
  labelRemove: {
    id: 'components.CourseAddToWishlist.labelRemove',
    description: 'Label to proceed to remove a course to user wishlist.',
    defaultMessage: 'Do not notify me anymore',
  },
  logMe: {
    id: 'components.CourseAddToWishlist.logMe',
    defaultMessage: 'Log in to be notified',
    description: 'Label to proceed to login page before being adding a course to user wishlist.',
  },
  loading: {
    id: 'components.CourseAddToWishlist.loading',
    defaultMessage: 'Loading your wishlist...',
    description: 'Accessible message displayed while loading wishlist',
  },
});

enum ComponentStates {
  INITIALIZING = 'initializing',
  LOADING = 'loading',
  IDLE = 'idle',
  ERROR = 'error',
}

export interface Props {
  courseCode: Joanie.Course['code'];
}

const CourseAddToWishlist = ({ courseCode }: Props) => {
  const { user, login } = useSession();
  const wishlistCourse = useUserWishlistCourses({ course_code: courseCode });

  const componentState = useMemo<ComponentStates>(() => {
    if (wishlistCourse.states.fetching) return ComponentStates.LOADING;
    if (wishlistCourse.states.error) return ComponentStates.ERROR;
    return ComponentStates.IDLE;
  }, [wishlistCourse.states.fetching, wishlistCourse.states.error]);
  const isInWishListCourse = useMemo(
    () => wishlistCourse.items?.length > 0,
    [wishlistCourse.items],
  );

  const removeFromWishlist = () => wishlistCourse.methods.delete(wishlistCourse.items[0].id);
  const addToWishlist = () => wishlistCourse.methods.create({ course: courseCode });

  if (user && !wishlistCourse.states.isFetched) {
    return (
      <Spinner aria-labelledby="loading-wishlist">
        <span id="loading-wishlist">
          <FormattedMessage {...messages.loading} />
        </span>
      </Spinner>
    );
  }

  return user ? (
    <>
      <Button
        color="primary"
        onClick={isInWishListCourse ? removeFromWishlist : addToWishlist}
        className="user-wishlist-button"
        disabled={componentState === ComponentStates.LOADING}
        {...(componentState === ComponentStates.ERROR && {
          'aria-describedby': 'user-wishlist-error',
        })}
      >
        <FormattedMessage {...messages[isInWishListCourse ? 'labelRemove' : 'labelAdd']} />
      </Button>
      {wishlistCourse.states.error && (
        <p className="user-wishlist-button__error" id="user-wishlist-error" tabIndex={-1}>
          {wishlistCourse.states.error}
        </p>
      )}
    </>
  ) : (
    <Button
      color="primary"
      onClick={login}
      className="user-wishlist-button"
      disabled={componentState === ComponentStates.LOADING}
    >
      <FormattedMessage {...messages.logMe} />
    </Button>
  );
};

export default CourseAddToWishlist;
