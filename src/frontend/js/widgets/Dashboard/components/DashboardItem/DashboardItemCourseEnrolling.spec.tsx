import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { PropsWithChildren } from 'react';
import { CredentialOrderFactory, EnrollmentFactory } from 'utils/test/factories/joanie';
import { Priority } from 'types';
import { CourseRun, Enrollment } from 'types/Joanie';
import { DEFAULT_DATE_FORMAT } from 'hooks/useDateFormat';
import { CourseRunFactoryFromPriority } from 'utils/test/factories/richie';
import { noop } from 'utils';
import { computeState } from 'utils/CourseRuns';
import { DashboardItemCourseEnrollingRun, Enrolled } from './DashboardItemCourseEnrolling';

/**
 * Most of the component of this file are tested from DashboardItemEnrollment.spec.tsx and
 * DashboardItemOrder.spec.tsx. But here are some tests that are more straightforward.
 */
describe('<Enrolled/>', () => {
  const wrapper = ({ children }: PropsWithChildren) => {
    return <IntlProvider locale="en">{children}</IntlProvider>;
  };

  it.each([
    {
      buttonTestLabel: 'and access course button',
      priority: Priority.ONGOING_OPEN,
      expectButton: true,
    },
    {
      buttonTestLabel: 'and no access course button',
      priority: Priority.FUTURE_OPEN,
      expectButton: false,
    },
    {
      buttonTestLabel: 'and access course button',
      priority: Priority.ARCHIVED_OPEN,
      expectButton: true,
    },
    {
      buttonTestLabel: 'and no access course button',
      priority: Priority.FUTURE_NOT_YET_OPEN,
      expectButton: false,
    },
    {
      buttonTestLabel: 'and no access course button',
      priority: Priority.FUTURE_CLOSED,
      expectButton: false,
    },
    {
      buttonTestLabel: 'and access course button',
      priority: Priority.ONGOING_CLOSED,
      expectButton: true,
    },
    {
      buttonTestLabel: 'and access course button',
      priority: Priority.ARCHIVED_CLOSED,
      expectButton: true,
    },
    {
      buttonTestLabel: 'and no access course button',
      priority: Priority.TO_BE_SCHEDULED,
      expectButton: false,
    },
  ])(
    'handles enrollments with priority=$priority $buttonTestLabel',
    async ({ priority, expectButton }) => {
      const enrollment: Enrollment = EnrollmentFactory().one();
      enrollment.course_run.state.priority = priority;
      render(<Enrolled enrollment={enrollment} />, { wrapper });
      await screen.findByText(
        'You are enrolled for the session from ' +
          new Intl.DateTimeFormat('en', DEFAULT_DATE_FORMAT).format(
            new Date(enrollment.course_run.start),
          ) +
          ' to ' +
          new Intl.DateTimeFormat('en', DEFAULT_DATE_FORMAT).format(
            new Date(enrollment.course_run.end),
          ),
      );
      if (expectButton) {
        const link = screen.getByRole('link', { name: 'Access to course' });
        expect(link).toBeEnabled();
        expect(link).toHaveAttribute('href', enrollment.course_run.resource_link);
      } else {
        expect(screen.queryByRole('link', { name: 'Access to course' })).toBeNull();
      }
    },
  );
});

describe('<DashboardItemCourseEnrollingRun/>', () => {
  it.each([
    [Priority.ONGOING_OPEN, false],
    [Priority.FUTURE_OPEN, false],
    [Priority.ARCHIVED_OPEN, false],
    [Priority.FUTURE_NOT_YET_OPEN, true],
    [Priority.FUTURE_CLOSED, false],
    [Priority.ONGOING_CLOSED, false],
    [Priority.ARCHIVED_CLOSED, false],
    [Priority.TO_BE_SCHEDULED, false],
  ])(
    `handles correctly enrollment_start date displaying with priority=%s`,
    async (priority, expectEnrollmentNotYetOpened) => {
      const order = CredentialOrderFactory().one();
      const courseRun = CourseRunFactoryFromPriority(priority)().one();
      courseRun.state = computeState(courseRun);
      const joanieCourseRun = courseRun as unknown as CourseRun;
      joanieCourseRun.course = order.course;

      render(
        <IntlProvider locale="en">
          <DashboardItemCourseEnrollingRun
            order={order}
            courseRun={joanieCourseRun}
            selected={false}
            enroll={noop}
          />
        </IntlProvider>,
      );

      if (expectEnrollmentNotYetOpened) {
        screen.getByText(/Enrollment will open on/);
      } else {
        expect(screen.queryByText(/Enrollment will open on/)).not.toBeInTheDocument();
      }
    },
  );
});
