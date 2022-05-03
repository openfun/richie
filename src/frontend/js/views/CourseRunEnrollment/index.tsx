import React, { useCallback, useEffect, useReducer } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import { Spinner } from 'components/Spinner';
import { useSession } from 'data/SessionProvider';
import { Priority } from 'types';
import { User } from 'types/User';
import { Maybe, Nullable } from 'types/utils';
import { handle } from 'utils/errors/handle';
import { CommonDataProps } from 'types/commonDataProps';
import useCourseEnrollment from 'data/useCourseEnrollment';

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
});

interface CourseRunEnrollmentProps {
  courseRun: {
    id: number;
    resource_link: string;
    priority: Priority;
    starts_in_message: Nullable<string>;
    dashboard_link: Nullable<string>;
  };
}

enum Step {
  ANONYMOUS = 'anonymous',
  CLOSED = 'closed',
  LOADING = 'loading',
  ENROLLED = 'enrolled',
  ENROLLING = 'enrolling',
  ENROLLMENT_FAILED = 'enrollmentFailed',
  FAILED = 'failed',
  IDLE = 'idle',
}

enum ActionType {
  UPDATE_CONTEXT = 'UPDATE_CONTEXT',
  ENROLL = 'ENROLL',
  ERROR = 'ERROR',
}
interface ReducerState {
  step: Step;
  context: {
    isEnrolled: Maybe<Nullable<Boolean>>;
    courseRun: CourseRunEnrollmentProps['courseRun'];
    currentUser: Maybe<Nullable<User>>;
  };
  error?: Error;
}
type ReducerAction =
  | { type: ActionType.UPDATE_CONTEXT; payload: Partial<ReducerState['context']> }
  | { type: ActionType.ENROLL }
  | { type: ActionType.ERROR; payload: { error: Error } };

const getStepFromContext = (
  { currentUser, courseRun, isEnrolled }: ReducerState['context'],
  previousStep?: Maybe<Step>,
) => {
  switch (true) {
    case courseRun.priority > Priority.ARCHIVED_OPEN:
      return Step.CLOSED;
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
      return { step: getStepFromContext(nextContext, step), context: nextContext };
    }
    case ActionType.ENROLL:
      return { step: Step.ENROLLING, context };
    case ActionType.ERROR:
      return { step: Step.FAILED, context, ...action.payload };
    default:
      return { step, context };
  }
};

const CourseRunEnrollment: React.FC<CourseRunEnrollmentProps & CommonDataProps> = (props) => {
  const { user, login } = useSession();
  const { enrollmentIsActive, setEnrollment } = useCourseEnrollment(props.courseRun.resource_link);

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

  const enroll = useCallback(async () => {
    dispatch({ type: ActionType.ENROLL });
    if (courseRun && currentUser) {
      const isEnrolled = await setEnrollment().catch(() => undefined);

      dispatch({
        type: ActionType.UPDATE_CONTEXT,
        payload: { isEnrolled },
      });
    }
  }, [courseRun, currentUser, dispatch]);

  useEffect(() => {
    dispatch({
      payload: { currentUser: user, isEnrolled: enrollmentIsActive },
      type: ActionType.UPDATE_CONTEXT,
    });
  }, [user, enrollmentIsActive]);

  switch (true) {
    case step === Step.CLOSED:
      return (
        <div className="course-run-enrollment__helptext">
          <FormattedMessage {...messages.enrollmentClosed} />
        </div>
      );
    case step === Step.ANONYMOUS:
      return (
        <button onClick={login} className="course-run-enrollment__cta">
          <FormattedMessage {...messages.loginToEnroll} />
        </button>
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
    case step === Step.ENROLLMENT_FAILED:
      return (
        <React.Fragment>
          <button
            onClick={enroll}
            className={`course-run-enrollment__cta ${
              step === Step.ENROLLING ? 'course-run-enrollment__cta--loading' : ''
            }`}
            aria-busy={step === Step.ENROLLING}
          >
            <FormattedMessage {...messages.enroll} />
            {step === Step.ENROLLING ? (
              <span aria-hidden="true">
                {/* No children with loading text as the spinner is aria-hidden (handled by aria-busy) */}
                <Spinner />
              </span>
            ) : null}
          </button>
          {step === Step.ENROLLMENT_FAILED ? (
            <div className="course-run-enrollment__errortext">
              <FormattedMessage {...messages.enrollmentFailed} />
            </div>
          ) : null}
        </React.Fragment>
      );
    case step === Step.ENROLLED:
      return courseRun.starts_in_message ? (
        <div>
          {courseRun.dashboard_link ? (
            <a href={courseRun.dashboard_link} className="course-run-enrollment__cta">
              <FormattedMessage {...messages.enrolled} />
            </a>
          ) : (
            <p className="course-run-enrollment__helptext">
              <FormattedMessage {...messages.enrolled} />
            </p>
          )}
          <p className="course-run-enrollment__helptext">{courseRun.starts_in_message}</p>
        </div>
      ) : (
        <div>
          <a href={courseRun.resource_link} className="course-run-enrollment__cta">
            <FormattedMessage {...messages.goToCourse} />
          </a>
          <div className="course-run-enrollment__helptext">
            <FormattedMessage {...messages.enrolled} />
          </div>
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
