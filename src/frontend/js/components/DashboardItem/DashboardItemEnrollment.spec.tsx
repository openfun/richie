import { IntlProvider } from 'react-intl';
import { DashboardItemEnrollment } from 'components/DashboardItem/DashboardItemEnrollment';
import { render, screen } from '@testing-library/react';
import { Enrollment } from 'types/Joanie';
import { JoanieCourseRunFactory, JoanieEnrollmentFactory } from 'utils/test/factories';
import * as faker from 'faker';
import { DEFAULT_DATE_FORMAT } from 'utils/useDateFormat';

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

    render(
      <IntlProvider locale="en">
        <DashboardItemEnrollment enrollment={enrollment} />
      </IntlProvider>,
    );
    screen.getByText(enrollment.course_run.course!.title);
    screen.getByText('Ref. ' + enrollment.course_run.course!.code);
    const link = screen.getByRole('link', { name: 'ACCESS COURSE' });
    expect(link).toBeEnabled();
    expect(link).toHaveAttribute('href', enrollment.course_run.resource_link);

    screen.getByText(
      'COURSE OPEN • Started on ' +
        new Intl.DateTimeFormat('en', DEFAULT_DATE_FORMAT).format(
          new Date(enrollment.course_run.start),
        ),
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
      },
    };

    render(
      <IntlProvider locale="en">
        <DashboardItemEnrollment enrollment={enrollment} />
      </IntlProvider>,
    );
    screen.getByText(enrollment.course_run.course!.title);
    screen.getByText('Ref. ' + enrollment.course_run.course!.code);
    const link = screen.getByRole('link', { name: 'ACCESS COURSE' });
    expect(link).toBeEnabled();
    expect(link).toHaveAttribute('href', enrollment.course_run.resource_link);
    screen.getByText(
      'CLOSED • Finished on ' +
        new Intl.DateTimeFormat('en', DEFAULT_DATE_FORMAT).format(
          new Date(enrollment.course_run.end),
        ),
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
    const link = screen.getByRole('link', { name: 'ACCESS COURSE' });
    expect(link).toBeEnabled();
    expect(link).toHaveAttribute('href', enrollment.course_run.resource_link);
    screen.getByText('NOT ENROLLED');
  });
});
