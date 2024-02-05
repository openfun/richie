import { render, screen } from '@testing-library/react';
import { IntlProvider, createIntl } from 'react-intl';
import { PropsWithChildren } from 'react';
import { CredentialOrderFactory, EnrollmentFactory } from 'utils/test/factories/joanie';
import { Priority } from 'types';
import { CourseRun, Enrollment } from 'types/Joanie';
import { DEFAULT_DATE_FORMAT } from 'hooks/useDateFormat';
import { CourseRunFactoryFromPriority } from 'utils/test/factories/richie';
import { noop } from 'utils';
import { computeState } from 'utils/CourseRuns';
import { formatRelativeDate } from 'utils/relativeDate';
import { DashboardItemCourseEnrollingRun, Enrolled } from '.';

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
      priorityLabel: 'ONGOING_OPEN',
      expectButton: true,
      expectLabelTemplate:
        "You are enrolled for this session. It's open from %fromDate% to %toDate%",
    },
    {
      buttonTestLabel: 'and no access course button',
      priority: Priority.FUTURE_OPEN,
      priorityLabel: 'FUTURE_OPEN',
      expectButton: false,
      expectLabelTemplate:
        'You are enrolled for this session. It starts %fromRelativeDate%, the %fromDate%.',
    },
    {
      buttonTestLabel: 'and access course button',
      priority: Priority.ARCHIVED_OPEN,
      priorityLabel: 'ARCHIVED_OPEN',
      expectButton: true,
      expectLabelTemplate: `You are enrolled for this session.`,
    },
    {
      buttonTestLabel: 'and no access course button',
      priority: Priority.FUTURE_NOT_YET_OPEN,
      priorityLabel: 'FUTURE_NOT_YET_OPEN',
      expectButton: false,
      expectLabelTemplate:
        'You are enrolled for this session. It starts %fromRelativeDate%, the %fromDate%.',
    },
    {
      buttonTestLabel: 'and no access course button',
      priority: Priority.FUTURE_CLOSED,
      priorityLabel: 'FUTURE_CLOSED',
      expectButton: false,
      expectLabelTemplate:
        'You are enrolled for this session. It starts %fromRelativeDate%, the %fromDate%.',
    },
    {
      buttonTestLabel: 'and access course button',
      priority: Priority.ONGOING_CLOSED,
      priorityLabel: 'ONGOING_CLOSED',
      expectButton: true,
      expectLabelTemplate: `You are enrolled for this session. It's open from %fromDate% to %toDate%`,
    },
    {
      buttonTestLabel: 'and access course button',
      priority: Priority.ARCHIVED_CLOSED,
      priorityLabel: 'ARCHIVED_CLOSED',
      expectButton: true,
      expectLabelTemplate: `You are enrolled for this session.`,
    },
    {
      buttonTestLabel: 'and no access course button',
      priority: Priority.TO_BE_SCHEDULED,
      priorityLabel: 'TO_BE_SCHEDULED',
      expectButton: false,
      expectLabelTemplate:
        'You are enrolled for this session. It starts %fromRelativeDate%, the %fromDate%.',
    },
  ])(
    'handles enrollments with priority=$priorityLabel $buttonTestLabel',
    async ({ priority, expectButton, expectLabelTemplate }) => {
      const enrollment: Enrollment = EnrollmentFactory().one();
      enrollment.course_run.state.priority = priority;
      render(<Enrolled enrollment={enrollment} />, { wrapper });
      const intl = createIntl({ locale: 'en' });

      const fromDate = new Intl.DateTimeFormat('en', DEFAULT_DATE_FORMAT).format(
        new Date(enrollment.course_run.start),
      );
      const fromRelativeDate = formatRelativeDate(
        new Date(enrollment.course_run.start),
        new Date(),
        intl.locale,
      );
      const toDate = new Intl.DateTimeFormat('en', DEFAULT_DATE_FORMAT).format(
        new Date(enrollment.course_run.end),
      );

      const expectLabel = expectLabelTemplate
        .replace('%fromRelativeDate%', fromRelativeDate)
        .replace('%fromDate%', fromDate)
        .replace('%toDate%', toDate);
      expect(await screen.findByText(expectLabel)).toBeInTheDocument();
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
