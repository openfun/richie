import { useMachine } from '@xstate/react';
import { stringify } from 'query-string';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { assign, Machine } from 'xstate';

import { Spinner } from 'components/Spinner';
import { CourseRun, Enrollment } from 'types';
import { User } from 'types/User';
import { Nullable } from 'utils/types';
import { handle } from 'utils/errors/handle';
import { CommonDataProps } from 'types/commonDataProps';

const messages = defineMessages({
  enroll: {
    defaultMessage: 'Enroll now',
    description:
      'CTA for users who can enroll in the course run or could enroll if they logged in.',
    id: 'components.CourseRunEnrollment.enroll',
  },
  enrolled: {
    defaultMessage: 'You are enrolled in this course run',
    description:
      'Help text for users who see the "Go to course" CTA on course run enrollment',
    id: 'components.CourseRunEnrollment.enrolled',
  },
  enrollmentClosed: {
    defaultMessage: 'Enrollment in this course run is closed at the moment',
    description:
      'Help text replacing the CTA on a course run when enrollment is closed.',
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
    defaultMessage: 'Sign up or log in to enroll',
    description:
      'Helper text below the disabled enrolle button for non logged in users',
    id: 'components.CourseRunEnrollment.loginToEnroll',
  },
});

interface MachineContext {
  courseRun: Nullable<CourseRun>;
  currentUser: Nullable<User>;
  enrollment: Nullable<Enrollment>;
}

const machine = Machine<MachineContext>({
  context: {
    courseRun: null,
    currentUser: null,
    enrollment: null,
  },
  initial: 'loadingInitial',
  states: {
    loadingInitial: {
      type: 'parallel',
      states: {
        courseRun: {
          initial: 'loading',
          states: {
            success: { type: 'final' },
            failure: {},
            loading: {
              invoke: {
                onDone: {
                  target: 'success',
                  actions: assign({ courseRun: (_, event) => event.data }),
                },
                onError: { target: 'failure' },
                src: 'getCourseRun',
              },
            },
          },
        },
        currentUser: {
          initial: 'loading',
          states: {
            success: { type: 'final' },
            failure: {},
            loading: {
              invoke: {
                onDone: {
                  target: 'success',
                  actions: assign({ currentUser: (_, event) => event.data }),
                },
                onError: { target: 'failure' },
                src: 'getCurrentUser',
              },
            },
          },
        },
        enrollment: {
          initial: 'loading',
          states: {
            success: { type: 'final' },
            failure: {},
            loading: {
              invoke: {
                onDone: {
                  target: 'success',
                  actions: assign({ enrollment: (_, event) => event.data }),
                },
                onError: { target: 'failure' },
                src: 'getEnrollment',
              },
            },
          },
        },
      },
      onDone: { target: 'readyInitial' },
    },
    // Determine where to go once initial loading is over based on a list of guards
    readyInitial: {
      on: {
        '': [
          { target: 'enrolled', cond: 'isEnrolled' },
          { target: 'closed', cond: 'isCourseRunClosed' },
          { target: 'idle', cond: 'isLoggedInUser' },
          // Anonymous is last: only users who are not logged-in but are looking at an
          // open-for-enrollment course run should end up in this state.
          { target: 'anonymous' },
        ],
      },
    },
    anonymous: {},
    closed: {},
    enrolled: {},
    enrollmentLoading: {
      invoke: {
        onDone: {
          target: 'enrolled',
          actions: assign({ enrollment: (_, event) => event.data }),
        },
        onError: { target: 'enrollmentFailed' },
        src: 'doEnroll',
      },
    },
    enrollmentFailed: {
      on: {
        ENROLL: { target: 'enrollmentLoading' },
      },
    },
    idle: {
      on: {
        ENROLL: { target: 'enrollmentLoading' },
      },
    },
  },
});

const headers = {
  'Content-Type': 'application/json',
};

interface CourseRunEnrollmentProps {
  courseRunId: number;
}

export const CourseRunEnrollment: React.FC<
  CourseRunEnrollmentProps & CommonDataProps
> = ({ context, courseRunId }) => {
  const [state, send] = useMachine(machine, {
    guards: {
      isCourseRunClosed: (ctx) =>
        !!ctx.courseRun && ctx.courseRun.state.priority > 1,
      isEnrolled: (ctx) => !!ctx.enrollment,
      isInitialReady: (ctx) =>
        !!ctx.courseRun && !!ctx.currentUser && !!ctx.enrollment,
      isLoggedInUser: (ctx) => !!ctx.currentUser,
    },
    services: {
      doEnroll: async () => {
        const response = await fetch(`/api/v1.0/enrollments/`, {
          body: JSON.stringify({ course_run_id: courseRunId }),
          headers: { ...headers, 'X-CSRFToken': context.csrftoken },
          method: 'POST',
        });
        if (response.ok) {
          return await response.json();
        }
        throw new Error(
          `Failed to enroll in ${courseRunId}, ${response.status}`,
        );
      },
      getCourseRun: async () => {
        const response = await fetch(`/api/v1.0/course-runs/${courseRunId}/`, {
          headers,
        });
        if (response.ok) {
          return await response.json();
        }
        throw new Error(
          `Failed to get course run ${courseRunId}, ${response.status}.`,
        );
      },
      getCurrentUser: async () => {
        const response = await fetch('/api/v1.0/users/whoami/', { headers });
        if (response.ok) {
          return await response.json();
        }
        // 401 is the expected response for anonymous users
        if (response.status === 401) {
          return null;
        }
        throw new Error(`Failed to get current user, ${response.status}.`);
      },
      getEnrollment: async () => {
        const params = { course_run: courseRunId };
        const response = await fetch(
          `/api/v1.0/enrollments/?${stringify(params)}`,
          { headers },
        );
        if (response.ok) {
          const enrollments = await response.json();
          return enrollments.length > 0 ? enrollments[0] : null;
        }
        throw new Error(
          `Failed to get enrollments for user, ${response.status}`,
        );
      },
    },
  });
  const { courseRun } = state.context;

  switch (true) {
    case state.matches('loadingInitial'):
      return (
        <Spinner
          size="small"
          aria-labelledby={`loading-course-run-${courseRunId}`}
        >
          <span id={`loading-course-run-${courseRunId}`}>
            <FormattedMessage {...messages.loadingInitial} />
          </span>
        </Spinner>
      );

    case state.matches('anonymous'):
      return (
        <React.Fragment>
          <button
            className="course-run-enrollment__cta disabled"
            aria-disabled="true"
          >
            <FormattedMessage {...messages.enroll} />
          </button>
          <div className="course-run-enrollment__helptext">
            <FormattedMessage {...messages.loginToEnroll} />
          </div>
        </React.Fragment>
      );

    case state.matches('closed'):
      return (
        <div className="course-run-enrollment__helptext">
          <FormattedMessage {...messages.enrollmentClosed} />
        </div>
      );

    case state.matches('idle'):
    case state.matches('enrollmentLoading'):
    case state.matches('enrollmentFailed'):
      return (
        <React.Fragment>
          <button
            onClick={() => send('ENROLL')}
            className={`course-run-enrollment__cta ${
              state.matches('enrollmentLoading')
                ? 'course-run-enrollment__cta--loading'
                : ''
            }`}
            aria-busy={state.matches('enrollmentLoading')}
          >
            <FormattedMessage {...messages.enroll} />
            {state.matches('enrollmentLoading') ? (
              <span aria-hidden="true">
                <Spinner>
                  <React.Fragment></React.Fragment>
                  {/* No children with loading text as the spinner is aria-hidden (handled by aria-busy) */}
                </Spinner>
              </span>
            ) : null}
          </button>
          {state.matches('enrollmentFailed') ? (
            <div className="course-run-enrollment__errortext">
              <FormattedMessage {...messages.enrollmentFailed} />
            </div>
          ) : null}
        </React.Fragment>
      );

    case state.matches('enrolled'):
      return (
        <React.Fragment>
          <a
            href={courseRun?.resource_link}
            className="course-run-enrollment__cta"
          >
            <FormattedMessage {...messages.goToCourse} />
          </a>
          <div className="course-run-enrollment__helptext">
            <FormattedMessage {...messages.enrolled} />
          </div>
        </React.Fragment>
      );
  }

  // Switch should cover all our cases. Report the error and do not render anything if we end up here.
  handle(
    new Error(`<CourseRunEnrollment /> in an impossible state, ${state.value}`),
  );
  return null;
};
