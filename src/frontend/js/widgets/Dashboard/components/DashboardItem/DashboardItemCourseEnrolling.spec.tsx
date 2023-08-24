import { render, screen } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { PropsWithChildren } from 'react';
import { EnrollmentFactory } from 'utils/test/factories/joanie';
import { Priority } from 'types';
import { Enrollment } from 'types/Joanie';
import { DATETIME_FORMAT } from 'hooks/useDateFormat';
import { Enrolled } from './DashboardItemCourseEnrolling';

/**
 * Most of the component of this file are tested from DashboardItemEnrollment.spec.tsx and
 * DashboardItemOrder.spec.tsx. But here are some tests that are more straightforward.
 */
describe('<Enrolled/>', () => {
  const wrapper = ({ children }: PropsWithChildren) => {
    return <IntlProvider locale="en">{children}</IntlProvider>;
  };

  const runTest = async (priority: Priority, expectButton: boolean) => {
    const enrollment: Enrollment = EnrollmentFactory().one();
    enrollment.course_run.state.priority = priority;
    render(<Enrolled enrollment={enrollment} />, { wrapper });
    await screen.findByText(
      'You are enrolled for the session from ' +
        new Intl.DateTimeFormat('en', DATETIME_FORMAT).format(
          new Date(enrollment.course_run.start),
        ) +
        ' to ' +
        new Intl.DateTimeFormat('en', DATETIME_FORMAT).format(new Date(enrollment.course_run.end)),
    );
    if (expectButton) {
      const link = screen.getByRole('link', { name: 'Access course' });
      expect(link).toBeEnabled();
      expect(link).toHaveAttribute('href', enrollment.course_run.resource_link);
    } else {
      expect(screen.queryByRole('link', { name: 'Access course' })).toBeNull();
    }
  };

  it('handles enrollments with priority=ONGOING_OPEN', () => {
    runTest(Priority.ONGOING_OPEN, true);
  });
  it('handles enrollments with priority=FUTURE_OPEN', () => {
    runTest(Priority.FUTURE_OPEN, false);
  });
  it('handles enrollments with priority=ARCHIVED_OPEN', () => {
    runTest(Priority.ARCHIVED_OPEN, true);
  });
  it('handles enrollments with priority=FUTURE_NOT_YET_OPEN', () => {
    runTest(Priority.FUTURE_NOT_YET_OPEN, false);
  });
  it('handles enrollments with priority=FUTURE_CLOSED', () => {
    runTest(Priority.FUTURE_CLOSED, false);
  });
  it('handles enrollments with priority=ONGOING_CLOSED', () => {
    runTest(Priority.ONGOING_CLOSED, true);
  });
  it('handles enrollments with priority=ARCHIVED_CLOSED', () => {
    runTest(Priority.ARCHIVED_CLOSED, true);
  });
  it('handles enrollments with priority=TO_BE_SCHEDULED', () => {
    runTest(Priority.TO_BE_SCHEDULED, false);
  });
});
