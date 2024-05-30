import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import { CourseRunFactory } from 'utils/test/factories/richie';
import { IntlWrapper } from 'utils/test/wrappers/IntlWrapper';
import EnrollmentDate from '.';

describe('<EnrollmentDate />', () => {
  const dateFormatter = Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  it('should display when enrollment will open if course run is not yet opened', () => {
    const courseRun = CourseRunFactory({
      enrollment_start: faker.date.future().toISOString(),
      enrollment_end: faker.date.future().toISOString(),
    }).one();

    render(
      <IntlWrapper>
        <EnrollmentDate
          enrollment_start={courseRun.enrollment_start}
          enrollment_end={courseRun.enrollment_end}
        />
      </IntlWrapper>,
    );

    screen.getByText(
      `Enrollment from ${dateFormatter.format(new Date(courseRun.enrollment_start))}`,
    );
  });

  it('should display when enrollment will end if course run is opened', () => {
    const courseRun = CourseRunFactory({
      enrollment_start: faker.date.past().toISOString(),
      enrollment_end: faker.date.future().toISOString(),
    }).one();

    render(
      <IntlWrapper>
        <EnrollmentDate
          enrollment_start={courseRun.enrollment_start}
          enrollment_end={courseRun.enrollment_end}
        />
      </IntlWrapper>,
    );

    screen.getByText(
      `Enrollment until ${dateFormatter.format(new Date(courseRun.enrollment_end))}`,
    );
  });

  it('should display the date since enrollment is opened if there is no enrollment end', () => {
    const courseRun = CourseRunFactory({
      enrollment_start: faker.date.past().toISOString(),
      enrollment_end: undefined,
    }).one();

    render(
      <IntlWrapper>
        <EnrollmentDate
          enrollment_start={courseRun.enrollment_start}
          enrollment_end={courseRun.enrollment_end}
        />
      </IntlWrapper>,
    );

    screen.getByText(
      `Enrollment open since ${dateFormatter.format(new Date(courseRun.enrollment_start))}`,
    );
  });

  it('should display a message to say that enrollment is closed if enrollment dates are passed', () => {
    const courseRun = CourseRunFactory({
      enrollment_start: faker.date.past().toISOString(),
      enrollment_end: faker.date.past().toISOString(),
    }).one();

    render(
      <IntlWrapper>
        <EnrollmentDate
          enrollment_start={courseRun.enrollment_start}
          enrollment_end={courseRun.enrollment_end}
        />
      </IntlWrapper>,
    );

    screen.getByText(
      `Enrollment closed since ${dateFormatter.format(new Date(courseRun.enrollment_end))}`,
    );
  });
});
