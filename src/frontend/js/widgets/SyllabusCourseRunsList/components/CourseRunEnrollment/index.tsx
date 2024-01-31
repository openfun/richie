import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import c from 'classnames';
import { Button } from '@openfun/cunningham-react';
import { Spinner } from 'components/Spinner';
import { useSession } from 'contexts/SessionContext';
import { CourseRun, Priority } from 'types';
import { User } from 'types/User';
import { Maybe, Nullable } from 'types/utils';
import { handle } from 'utils/errors/handle';
import { HttpError } from 'utils/errors/HttpError';
import useCourseEnrollment from 'widgets/SyllabusCourseRunsList/hooks/useCourseEnrollment';
import { CourseRunUnenrollButton } from 'widgets/SyllabusCourseRunsList/components/CourseRunEnrollment/CourseRunUnenrollmentButton';
import useDateRelative from 'hooks/useDateRelative';
import { isEnrollment as isJoanieEnrollment } from 'types/Joanie';

const messages = defineMessages({
  enroll: {
    defaultMessage: 'Enroll now',
    description:
      'CTA for users who can enroll in the course run or could enroll if they logged in.',
    id: 'components.CourseRunEnrollment.enroll',
  },
  enrolled: {
    defaultMessage: 'You are enrolled in this course run',
    description: 'Help text for users who see the "Go to course" CTA on course run enrollment',
    id: 'components.CourseRunEnrollment.enrolled',
  },
  getEnrollmentFailed: {
    defaultMessage: 'Enrollment fetching failed',
    description:
      'Help text replacing the CTA on a course run when when enrollment fetching failed.',
    id: 'components.CourseRunEnrollment.getEnrollmentFailed',
  },
  enrollmentClosed: {
    defaultMessage: 'Enrollment in this course run is closed at the moment',
    description: 'Help text replacing the CTA on a course run when enrollment is closed.',
    id: 'components.CourseRunEnrollment.enrollmentClosed',
  },
  enrollmentFailed: {
    defaultMessage: 'Your enrollment request failed.',
    description:
      'Help text below the "Enroll now" CTA when an enrollment attempt has already failed.',
    id: 'components.CourseRunEnrollment.enrollmentFailed',
  },
  unenroll: {
    defaultMessage: 'Unenroll from this course',
    description:
      'Help text below the "Unenroll now" CTA when an enrollment attempt has already failed.',
    id: 'components.CourseRunEnrollment.unenroll',
  },
  unenrollmentFailed: {
    defaultMessage: 'Your unenrollment request failed.',
    description:
      'Help text below the "Unenroll now" CTA when an enrollment attempt has already failed.',
    id: 'components.CourseRunEnrollment.unenrollmentFailed',
  },
  goToCourse: {
    defaultMessage: 'Go to course',
    description: 'CTA for users who are already enrolled in a course run.',
    id: 'components.CourseRunEnrollment.goToCourse',
  },
  loadingInitial: {
    defaultMessage: 'Loading enrollment information...',
    description:
      'Accessible text for the initial loading spinner on the course run enrollment button.',
    id: 'components.CourseRunEnrollment.loadingInitial',
  },
  loginToEnroll: {
    defaultMessage: 'Log in to enroll',
    description: 'Helper text in the enroll button for non logged in users',
    id: 'components.CourseRunEnrollment.loginToEnroll',
  },
  courseRunStartIn: {
    defaultMessage: 'The course starts {relativeStartDate}',
    description: 'Message displayed when user is enrolled but the course run is not started',
    id: 'components.CourseRunEnrollment.courseRunStartIn',
  },
});

interface CourseRunEnrollmentProps {
  courseRun: CourseRun;
}

enum Step {
  ANONYMOUS = 'anonymous',
  CLOSED = 'closed',
  LOADING = 'loading',
  UNENROLLED = 'unenrolled',
  ENROLLED = 'enrolled',
  ENROLLING = 'enrolling',

  UNENROLLING = 'unenrolling',
  ENROLLMENT_FAILED = 'enrollmentFailed',
  UNENROLLMENT_FAILED = 'unenrollmentFailed',
  FAILED = 'failed',
  IDLE = 'idle',
}

enum ActionType {
  UPDATE_CONTEXT = 'UPDATE_CONTEXT',
  ENROLL = 'ENROLL',
  UNENROLL = 'UNENROLL',
  ERROR = 'ERROR',
}
interface ReducerState {
  step: Step;
  context: {
    isEnrolled: Maybe<Nullable<Boolean>>;
    courseRun: CourseRunEnrollmentProps['courseRun'];
    currentUser: Maybe<Nullable<User>>;
  };
  error?: HttpError;
}
type ReducerAction =
  | {
      type: ActionType.UPDATE_CONTEXT;
      payload: Partial<ReducerState['context']>;
      error?: HttpError;
    }
  | { type: ActionType.ENROLL }
  | { type: ActionType.UNENROLL }
  | { type: ActionType.ERROR; payload: { error: HttpError } };

const getStepFromContext = (
  { currentUser, courseRun, isEnrolled }: ReducerState['context'],
  previousStep?: Maybe<Step>,
) => {
  switch (true) {
    case courseRun.state.priority > Priority.ARCHIVED_OPEN:
      return Step.CLOSED;
    case previousStep === Step.UNENROLLING && isEnrolled:
      return Step.UNENROLLMENT_FAILED;
    case previousStep === Step.ENROLLING && !isEnrolled:
      return Step.ENROLLMENT_FAILED;
    case currentUser === null:
      return Step.ANONYMOUS;
    case currentUser === undefined || courseRun === undefined || isEnrolled === undefined:
      return Step.LOADING;
    case !!isEnrolled:
      return Step.ENROLLED;
    case !isEnrolled:
      return Step.IDLE;
    default:
      throw new Error('Impossible state');
  }
};

const initialState = (
  currentUser: Maybe<Nullable<User>>,
  courseRun: CourseRunEnrollmentProps['courseRun'],
  isEnrolled: Maybe<boolean>,
) => ({
  step: getStepFromContext({ currentUser, courseRun, isEnrolled }),
  context: {
    currentUser,
    courseRun,
    isEnrolled,
  },
});

const reducer = ({ step, context }: ReducerState, action: ReducerAction): ReducerState => {
  switch (action.type) {
    case ActionType.UPDATE_CONTEXT: {
      const nextContext = { ...context, ...action.payload };
      return {
        step: getStepFromContext(nextContext, step),
        context: nextContext,
        error: action.error,
      };
    }
    case ActionType.ENROLL:
      return { step: Step.ENROLLING, context };
    case ActionType.UNENROLL:
      return { step: Step.UNENROLLING, context };
    case ActionType.ERROR:
      return { step: Step.FAILED, context, ...action.payload };
    default:
      return { step, context };
  }
};

const CourseRunEnrollment: React.FC<CourseRunEnrollmentProps> = (props) => {
  const { user, login } = useSession();
  const { enrollment, enrollmentIsActive, setEnrollment, canUnenroll, states } =
    useCourseEnrollment(props.courseRun.resource_link);
  const startDate = new Date(props.courseRun.start);
  const isStarted = new Date() > startDate;
  const relativeStartDate = useDateRelative(startDate);

  const [
    {
      context: { currentUser, courseRun },
      error,
      step,
    },
    dispatch,
  ] = useReducer<React.Reducer<ReducerState, ReducerAction>, ReducerState>(
    reducer,
    initialState(user, props.courseRun, enrollmentIsActive),
    (s) => s,
  );

  const setEnroll = useCallback(
    async (isActive: boolean = true) => {
      dispatch({ type: isActive ? ActionType.ENROLL : ActionType.UNENROLL });
      let isEnrolled = enrollmentIsActive;
      let enrollmentError;

      if (courseRun && currentUser) {
        try {
          isEnrolled = await setEnrollment(isActive);
        } catch (err) {
          if (err instanceof HttpError) {
            enrollmentError = err;
          }
        } finally {
          dispatch({
            type: ActionType.UPDATE_CONTEXT,
            payload: { isEnrolled },
            error: enrollmentError,
          });
        }
      }
    },
    [courseRun, currentUser, dispatch, enrollmentIsActive],
  );

  const LmsCourseLink = useMemo(() => {
    if (states.isLoading) {
      return null;
    }
    if (isJoanieEnrollment(enrollment)) {
      return enrollment.course_run.resource_link;
    }
    return courseRun.resource_link;
  }, [courseRun, enrollment]);

  useEffect(() => {
    dispatch({
      payload: { currentUser: user, isEnrolled: enrollmentIsActive },
      type: ActionType.UPDATE_CONTEXT,
    });
  }, [user, enrollmentIsActive]);

  switch (true) {
    case states.errors.get:
      return (
        <div className="course-run-enrollment__helptext">
          <FormattedMessage {...messages.getEnrollmentFailed} />
        </div>
      );
    case step === Step.CLOSED:
      return (
        <div className="course-run-enrollment__helptext">
          <FormattedMessage {...messages.enrollmentClosed} />
        </div>
      );
    case step === Step.ANONYMOUS:
      return (
        <Button onClick={login} fullWidth>
          <FormattedMessage {...messages.loginToEnroll} />
        </Button>
      );
    case step === Step.LOADING:
      return (
        <Spinner size="small" aria-labelledby={`loading-course-run-${courseRun.id}`}>
          <span id={`loading-course-run-${courseRun.id}`}>
            <FormattedMessage {...messages.loadingInitial} />
          </span>
        </Spinner>
      );
    case step === Step.IDLE:
    case step === Step.ENROLLING:
    case step === Step.UNENROLLING:
    case step === Step.ENROLLMENT_FAILED:
    case step === Step.UNENROLLMENT_FAILED:
      return (
        <React.Fragment>
          <Button
            onClick={() => setEnroll(true)}
            className={c({
              'course-run-enrollment__cta--loading': step === Step.ENROLLING,
            })}
            fullWidth
            aria-busy={step === Step.ENROLLING}
          >
            <FormattedMessage {...messages.enroll} />
            {step === Step.ENROLLING ? (
              <span aria-hidden="true">
                {/* No children with loading text as the spinner is aria-hidden (handled by aria-busy) */}
                <Spinner />
              </span>
            ) : null}
          </Button>
          {step === Step.ENROLLMENT_FAILED ? (
            <div className="course-run-enrollment__errortext">
              {error?.localizedMessage ? (
                error.localizedMessage
              ) : (
                <FormattedMessage {...messages.enrollmentFailed} />
              )}
            </div>
          ) : null}
          {step === Step.UNENROLLMENT_FAILED ? (
            <div className="course-run-enrollment__errortext">
              <FormattedMessage {...messages.unenrollmentFailed} />
            </div>
          ) : null}
        </React.Fragment>
      );
    case step === Step.ENROLLED:
      return isStarted ? (
        <div>
          <Button
            href={LmsCourseLink === null ? '#' : LmsCourseLink}
            disabled={LmsCourseLink === null}
            className="course-run-enrollment__cta"
            fullWidth={true}
          >
            <FormattedMessage {...messages.goToCourse} />
          </Button>
          <div className="course-run-enrollment__helptext">
            <FormattedMessage {...messages.enrolled} />
            {canUnenroll && <CourseRunUnenrollButton onUnenroll={() => setEnroll(false)} />}
          </div>
        </div>
      ) : (
        <div>
          {courseRun.dashboard_link ? (
            <Button href={courseRun.dashboard_link} className="course-run-enrollment__cta">
              <FormattedMessage {...messages.enrolled} />
            </Button>
          ) : (
            <p className="course-run-enrollment__helptext">
              <FormattedMessage {...messages.enrolled} />
            </p>
          )}
          {canUnenroll && <CourseRunUnenrollButton onUnenroll={() => setEnroll(false)} />}
          <p className="course-run-enrollment__helptext">
            <FormattedMessage {...messages.courseRunStartIn} values={{ relativeStartDate }} />
          </p>
        </div>
      );
  }

  if (step === Step.FAILED && error) {
    handle(error);
  } else {
    // Switch should cover all our cases. Report the error and do not render anything if we end up here.
    handle(new Error(`<CourseRunEnrollment /> in an impossible state, ${JSON.stringify(step)}`));
  }
  return null;
};

export default CourseRunEnrollment;
