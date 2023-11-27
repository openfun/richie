import { useMemo } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { Spinner } from 'components/Spinner';
import { useSession } from 'contexts/SessionContext';
import { CourseLight } from 'types/Joanie';
import { useCourseWish } from './hooks/useCourseWish';

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
  course: CourseLight;
}

const CourseWishButton = ({ course }: Props) => {
  const code = course.code!;
  const { user, login } = useSession();
  const courseWish = useCourseWish(code);

  const componentState = useMemo<ComponentStates>(() => {
    if (courseWish.states.fetching) return ComponentStates.LOADING;
    if (courseWish.states.error) return ComponentStates.ERROR;
    return ComponentStates.IDLE;
  }, [courseWish.states.fetching, courseWish.states.error]);

  const isWished = courseWish.item?.status;

  const removeFromWishlist = () => courseWish.methods.delete(code);
  const addToWishlist = () => courseWish.methods.create(code);

  if (user && !courseWish.states.isFetched) {
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
        onClick={isWished ? removeFromWishlist : addToWishlist}
        fullWidth
        disabled={componentState === ComponentStates.LOADING}
        {...(componentState === ComponentStates.ERROR && {
          'aria-describedby': 'user-wishlist-error',
        })}
      >
        <FormattedMessage {...messages[isWished ? 'labelRemove' : 'labelAdd']} />
      </Button>
      {courseWish.states.error && (
        <p className="user-wishlist-button__error" id="user-wishlist-error" tabIndex={-1}>
          {courseWish.states.error}
        </p>
      )}
    </>
  ) : (
    <Button
      color="primary"
      onClick={login}
      fullWidth
      disabled={componentState === ComponentStates.LOADING}
    >
      <FormattedMessage {...messages.logMe} />
    </Button>
  );
};

export default CourseWishButton;
