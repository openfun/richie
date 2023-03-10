import { IntlProvider } from 'react-intl';
import { render, screen } from '@testing-library/react';
import * as faker from 'faker';
import { Enrollment } from 'types/Joanie';
import {
  CourseStateFactory,
  JoanieCourseRunFactory,
  JoanieEnrollmentFactory,
} from 'utils/test/factories';
import { DATETIME_FORMAT } from 'hooks/useDateFormat';
import { Priority } from 'types';
import { DashboardItemEnrollment } from './DashboardItemEnrollment';

describe('<DashboardItemEnrollment/>', () => {
  it('renders a opened enrollment', () => {
    const enrollment: Enrollment = {
      ...JoanieEnrollmentFactory.generate(),
      course_run: {
        ...JoanieCourseRunFactory({ course: true }).generate(),
        enrollment_start: faker.date.past(0.25).toISOString(),
        enrollment_end: faker.date.future(0.5).toISOString(),
        start: faker.date.future(0.75).toISOString(),
        end: faker.date.future(1.0).toISOString(),
      },
    };
    enrollment.course_run.state.priority = Priority.ONGOING_OPEN;

    render(
      <IntlProvider locale="en">
        <DashboardItemEnrollment enrollment={enrollment} />
      </IntlProvider>,
    );
    screen.getByText(enrollment.course_run.course!.title);
    screen.getByText('Ref. ' + enrollment.course_run.course!.code);
    const link = screen.getByRole('link', { name: 'Access course' });
    expect(link).toBeEnabled();
    expect(link).toHaveAttribute('href', enrollment.course_run.resource_link);

    screen.getByText(
      'You are enrolled for the session from ' +
        new Intl.DateTimeFormat('en', DATETIME_FORMAT).format(
          new Date(enrollment.course_run.start),
        ) +
        ' to ' +
        new Intl.DateTimeFormat('en', DATETIME_FORMAT).format(new Date(enrollment.course_run.end)),
    );
  });

  it('renders a closed enrollment', () => {
    const enrollment: Enrollment = {
      ...JoanieEnrollmentFactory.generate(),
      course_run: {
        ...JoanieCourseRunFactory({ course: true }).generate(),
        enrollment_start: faker.date.past(1).toISOString(),
        enrollment_end: faker.date.past(0.75).toISOString(),
        start: faker.date.past(0.25).toISOString(),
        end: faker.date.past(0.5).toISOString(),
        state: { ...CourseStateFactory.generate(), priority: Priority.ARCHIVED_CLOSED },
      },
    };

    render(
      <IntlProvider locale="en">
        <DashboardItemEnrollment enrollment={enrollment} />
      </IntlProvider>,
    );
    screen.getByText(enrollment.course_run.course!.title);
    screen.getByText('Ref. ' + enrollment.course_run.course!.code);
    const link = screen.getByRole('link', { name: 'Access course' });
    expect(link).toBeEnabled();
    expect(link).toHaveAttribute('href', enrollment.course_run.resource_link);
    screen.getByText(
      'You are enrolled for the session from ' +
        new Intl.DateTimeFormat('en', DATETIME_FORMAT).format(
          new Date(enrollment.course_run.start),
        ) +
        ' to ' +
        new Intl.DateTimeFormat('en', DATETIME_FORMAT).format(new Date(enrollment.course_run.end)),
    );
  });

  it('renders an inactive enrollment', () => {
    const enrollment: Enrollment = {
      ...JoanieEnrollmentFactory.generate(),
      is_active: false,
      course_run: {
        ...JoanieCourseRunFactory({ course: true }).generate(),
      },
    };

    render(
      <IntlProvider locale="en">
        <DashboardItemEnrollment enrollment={enrollment} />
      </IntlProvider>,
    );
    screen.getByText(enrollment.course_run.course!.title);
    screen.getByText('Ref. ' + enrollment.course_run.course!.code);
    screen.getByText('Not enrolled');
  });
});
