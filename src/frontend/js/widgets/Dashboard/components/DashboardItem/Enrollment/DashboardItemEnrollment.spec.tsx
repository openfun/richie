import { IntlProvider } from 'react-intl';
import { render, screen } from '@testing-library/react';
import { faker } from '@faker-js/faker';
import { QueryClientProvider } from '@tanstack/react-query';
import { Enrollment } from 'types/Joanie';
import {
  CourseStateFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import { CourseRunWithCourseFactory, EnrollmentFactory } from 'utils/test/factories/joanie';
import { DATETIME_FORMAT } from 'hooks/useDateFormat';
import { Priority } from 'types';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { DashboardItemEnrollment } from './DashboardItemEnrollment';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint.test' },
  }).one(),
}));

describe('<DashboardItemEnrollment/>', () => {
  const Wrapper = ({ enrollment }: { enrollment: Enrollment }) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient()}>
        <JoanieSessionProvider>
          <DashboardItemEnrollment enrollment={enrollment} />
        </JoanieSessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );

  it('renders a opened enrollment', () => {
    const enrollment: Enrollment = EnrollmentFactory({
      course_run: CourseRunWithCourseFactory({
        enrollment_start: faker.date.past({ years: 0.25 }).toISOString(),
        enrollment_end: faker.date.future({ years: 0.5 }).toISOString(),
        start: faker.date.future({ years: 0.75 }).toISOString(),
        end: faker.date.future({ years: 1.0 }).toISOString(),
      }).one(),
    }).one();
    enrollment.course_run.state.priority = Priority.ONGOING_OPEN;

    render(<Wrapper enrollment={enrollment} />);
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
    const enrollment: Enrollment = EnrollmentFactory({
      course_run: CourseRunWithCourseFactory({
        enrollment_start: faker.date.past({ years: 1 }).toISOString(),
        enrollment_end: faker.date.past({ years: 0.75 }).toISOString(),
        start: faker.date.past({ years: 0.25 }).toISOString(),
        end: faker.date.past({ years: 0.5 }).toISOString(),
        state: CourseStateFactory({ priority: Priority.ARCHIVED_CLOSED }).one(),
      }).one(),
    }).one();

    render(<Wrapper enrollment={enrollment} />);
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
      ...EnrollmentFactory().one(),
      is_active: false,
      course_run: CourseRunWithCourseFactory().one(),
    };

    render(<Wrapper enrollment={enrollment} />);
    screen.getByText(enrollment.course_run.course!.title);
    screen.getByText('Ref. ' + enrollment.course_run.course!.code);
    screen.getByText('Not enrolled');
  });
});
