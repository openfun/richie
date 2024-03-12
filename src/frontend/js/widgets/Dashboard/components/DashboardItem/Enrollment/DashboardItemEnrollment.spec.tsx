import { screen } from '@testing-library/react';
import { faker } from '@faker-js/faker';
import { Enrollment } from 'types/Joanie';
import {
  CourseStateFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import { CourseRunWithCourseFactory, EnrollmentFactory } from 'utils/test/factories/joanie';
import { DEFAULT_DATE_FORMAT } from 'hooks/useDateFormat';
import { Priority } from 'types';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { DashboardItemEnrollment } from './DashboardItemEnrollment';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.endpoint.test' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

describe('<DashboardItemEnrollment/>', () => {
  setupJoanieSession();

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

    render(<DashboardItemEnrollment enrollment={enrollment} />);
    screen.getByText(enrollment.course_run.course!.title);
    screen.getByText('Ref. ' + enrollment.course_run.course!.code);
    const link = screen.getByRole('link', { name: 'Access to course' });
    expect(link).toBeEnabled();
    expect(link).toHaveAttribute('href', enrollment.course_run.resource_link);

    const fromDate = new Intl.DateTimeFormat('en', DEFAULT_DATE_FORMAT).format(
      new Date(enrollment.course_run.start),
    );
    const toDate = new Intl.DateTimeFormat('en', DEFAULT_DATE_FORMAT).format(
      new Date(enrollment.course_run.end),
    );
    screen.getByText(`You are enrolled for this session. It's open from ${fromDate} to ${toDate}`);
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

    render(<DashboardItemEnrollment enrollment={enrollment} />);
    screen.getByText(enrollment.course_run.course!.title);
    screen.getByText('Ref. ' + enrollment.course_run.course!.code);
    const link = screen.getByRole('link', { name: 'Access to course' });
    expect(link).toBeEnabled();
    expect(link).toHaveAttribute('href', enrollment.course_run.resource_link);
    expect(screen.getByText(/You are enrolled for this session./)).toBeInTheDocument();
  });

  it('renders an inactive enrollment', () => {
    const enrollment: Enrollment = EnrollmentFactory({
      is_active: false,
      course_run: CourseRunWithCourseFactory().one(),
    }).one();

    render(<DashboardItemEnrollment enrollment={enrollment} />);
    screen.getByText(enrollment.course_run.course!.title);
    screen.getByText('Ref. ' + enrollment.course_run.course!.code);
    screen.getByText('Not enrolled');
  });
});
