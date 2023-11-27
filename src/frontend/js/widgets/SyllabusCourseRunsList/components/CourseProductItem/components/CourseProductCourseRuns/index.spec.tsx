import { faker } from '@faker-js/faker';
import { act, fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import type { PropsWithChildren } from 'react';
import { IntlProvider, createIntl } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import {
  CourseLightFactory,
  CourseRunFactory,
  EnrollmentFactory,
  CredentialOrderFactory,
  ProductFactory,
} from 'utils/test/factories/joanie';
import JoanieApiProvider from 'contexts/JoanieApiContext';
import type { CourseLight, CourseRun, Enrollment } from 'types/Joanie';
import { Deferred } from 'utils/test/deferred';
import { CourseStateTextEnum, Priority } from 'types';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { IntlHelper } from 'utils/IntlHelper';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { CourseRunList, EnrollableCourseRunList, EnrolledCourseRun } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://auth.test' },
    joanie_backend: { endpoint: 'https://joanie.test' },
  }).one(),
}));

describe('CourseProductCourseRuns', () => {
  const dateFormatter = Intl.DateTimeFormat('en', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  afterEach(() => {
    fetchMock.restore();
  });

  describe('CourseRunList', () => {
    const Wrapper = ({ children }: PropsWithChildren<{}>) => (
      <IntlProvider locale="en">{children}</IntlProvider>
    );

    it('renders a warning message when no course runs are provided', () => {
      render(
        <Wrapper>
          <CourseRunList courseRuns={[]} />
        </Wrapper>,
      );

      expect(screen.getByText('No session available for this course.'));
    });

    it('renders a list of course runs', () => {
      const courseRuns: CourseRun[] = CourseRunFactory().many(2);

      const { container } = render(
        <Wrapper>
          <CourseRunList courseRuns={courseRuns} />
        </Wrapper>,
      );

      // It should render all course runs provided
      expect(screen.getAllByRole('listitem')).toHaveLength(2);

      // there should be "Start" and "End" labels, hidden from screen readers
      // (they are repeated for SR users on each course run line, see below)
      const $section = container.querySelector('.course__course-runs-header');
      expect($section?.getAttribute('aria-hidden')).toBe('true');
      expect($section?.textContent).toBe('StartEnd');

      // For each course run, it should render course and enrollment dates
      courseRuns.forEach((courseRun: CourseRun) => {
        // - Course run start date should be displayed
        const $startDate = screen.getByTestId(`course-run-${courseRun.id}-start-date`);
        expect($startDate.textContent).toEqual(dateFormatter.format(new Date(courseRun.start)));

        // - Course run end date should be displayed
        const $endDate = screen.getByTestId(`course-run-${courseRun.id}-end-date`);
        expect($endDate.textContent).toEqual(dateFormatter.format(new Date(courseRun.end)));

        // "start" and "end" labels should be here, but visually hidden, only for screen reader users
        const $offscreenStartDate = screen.getByTestId(
          `course-run-${courseRun.id}-offscreen-start-date`,
        );
        const $offscreenEndDate = screen.getByTestId(
          `course-run-${courseRun.id}-offscreen-end-date`,
        );
        expect($offscreenStartDate.textContent).toEqual('Start');
        expect($offscreenStartDate.classList.contains('offscreen')).toBe(true);
        expect($offscreenEndDate.textContent).toEqual('End');
        expect($offscreenEndDate.classList.contains('offscreen')).toBe(true);

        // - Course run enrollment dates should be displayed
        const $enrollmentDates = screen.getByTestId(`course-run-${courseRun.id}-enrollment-dates`);
        expect($enrollmentDates.textContent).toEqual(
          new Date(courseRun.enrollment_start) > new Date()
            ? // Enrollment is not yet opened
              `Enrollment from ${dateFormatter.format(new Date(courseRun.enrollment_start))}`
            : // Enrollment is open
              `Enrollment until ${dateFormatter.format(new Date(courseRun.enrollment_end))}`,
        );

        // - Course run languages should be displayed
        const $courseRunLanguages = screen.getByTestId(`course-run-${courseRun.id}-languages`);
        const intl = createIntl({ locale: 'en' });

        expect($courseRunLanguages.textContent).toEqual(
          (courseRun.languages.length > 1 ? 'Languages: ' : 'Language: ') +
            IntlHelper.getLocalizedLanguages(courseRun.languages, intl),
        );
      });
    });
  });

  describe('EnrollableCourseRunList', () => {
    const Wrapper = ({ children }: PropsWithChildren) => (
      <IntlProvider locale="en">
        <QueryClientProvider client={createTestQueryClient()}>
          <JoanieApiProvider>{children}</JoanieApiProvider>
        </QueryClientProvider>
      </IntlProvider>
    );

    it('renders a warning message when no course runs are provided', () => {
      const order = CredentialOrderFactory().one();
      const product = ProductFactory().one();

      render(
        <Wrapper>
          <EnrollableCourseRunList courseRuns={[]} order={order} product={product} />
        </Wrapper>,
      );

      expect(screen.getByText('No session available for this course.'));
    });

    it('renders a list of course runs with a call to action to enroll', async () => {
      const courseRuns: CourseRun[] = CourseRunFactory().many(2);
      const order = CredentialOrderFactory().one();
      const product = ProductFactory({
        contract_definition: undefined,
      }).one();

      render(
        <Wrapper>
          <EnrollableCourseRunList courseRuns={courseRuns} order={order} product={product} />
        </Wrapper>,
      );

      // the list should contain only the course run items, without the call to action button
      expect(screen.getAllByRole('listitem')).toHaveLength(2);

      // For each course run, it should render course, enrollment dates and a checkbox input
      // to select the course run
      courseRuns.forEach((courseRun: CourseRun) => {
        // - Course run start date should be displayed
        const $startDate = screen.getByTestId(`course-run-${courseRun.id}-start-date`);
        expect($startDate.textContent).toEqual(dateFormatter.format(new Date(courseRun.start)));

        // - Course run end date should be displayed
        const $endDate = screen.getByTestId(`course-run-${courseRun.id}-end-date`);
        expect($endDate.textContent).toEqual(dateFormatter.format(new Date(courseRun.end)));

        // - Course run enrollment dates should be displayed
        const $enrollmentDates = screen.getByTestId(`course-run-${courseRun.id}-enrollment-dates`);
        expect($enrollmentDates.textContent).toEqual(
          new Date(courseRun.enrollment_start) > new Date()
            ? // Enrollment is not yet opened
              `Enrollment from ${dateFormatter.format(new Date(courseRun.enrollment_start))}`
            : // Enrollment is open
              `Enrollment until ${dateFormatter.format(new Date(courseRun.enrollment_end))}`,
        );

        // - Course run languages should be displayed
        const $courseRunLanguages = screen.getByTestId(`course-run-${courseRun.id}-languages`);
        const intl = createIntl({ locale: 'en' });

        expect($courseRunLanguages.textContent).toEqual(
          (courseRun.languages.length > 1 ? 'Languages: ' : 'Language: ') +
            IntlHelper.getLocalizedLanguages(courseRun.languages, intl),
        );

        // - A radio input
        screen.getByRole('radio', {
          name: `Select course run from ${dateFormatter.format(
            new Date(courseRun.start),
          )} to ${dateFormatter.format(new Date(courseRun.end))}.`,
        });
      });

      // A call to action should be displayed
      let $button: HTMLButtonElement = screen.getByRole('button', {
        name: 'Enroll',
      });
      // the button should be enabled to provide feedback to user on what to do if he clicks it early
      expect($button.disabled).toBe(false);

      // when we click the button without selecting anything, an error should be displayed
      await act(async () => {
        fireEvent.click($button);
      });
      const error = screen.getByText('Select a course run');
      // the error should be focused so that screen reader users understand better
      expect(document.activeElement).toEqual(error);
      expect($button.disabled).toBe(false);

      // Once a course run is selected, it should be enabled and allows user to enroll
      await act(async () => {
        // - Select the first course run
        const $radio = screen.getByRole('radio', {
          name: `Select course run from ${dateFormatter.format(
            new Date(courseRuns[0].start),
          )} to ${dateFormatter.format(new Date(courseRuns[0].end))}.`,
        });
        fireEvent.click($radio);
      });

      $button = screen.getByRole('button', {
        name: 'Enroll',
      });
      expect($button.disabled).toBe(false);

      // - User clicks to enroll
      fetchMock.resetHistory();
      const enrollmentDeferred = new Deferred();
      fetchMock.post('https://joanie.test/api/v1.0/enrollments/', enrollmentDeferred.promise);

      await act(async () => {
        fireEvent.click($button);
      });

      // A spinner should be displayed
      screen.getByRole('status', { name: 'Enrolling...' });

      await act(async () => {
        enrollmentDeferred.resolve(HttpStatusCode.OK);
      });

      const calls = fetchMock.calls();
      expect(calls).toHaveLength(1);
      // A request to create the enrollment should have been executed
      expect(calls[0][0]).toBe('https://joanie.test/api/v1.0/enrollments/');
      expect(JSON.parse(fetchMock.calls()[0][1]!.body as string)).toEqual({
        is_active: true,
        course_run_id: courseRuns[0].id,
        was_created_by_order: true,
      });
    });

    it('enroll with errors', async () => {
      const course: CourseLight = CourseLightFactory().one();
      const courseRuns: CourseRun[] = CourseRunFactory().many(2);
      const order = CredentialOrderFactory().one();
      const product = ProductFactory().one();
      product.contract_definition = undefined;
      fetchMock.get(`https://joanie.test/api/v1.0/courses/${course.code}/`, HttpStatusCode.OK);

      render(
        <Wrapper>
          <EnrollableCourseRunList courseRuns={courseRuns} order={order} product={product} />
        </Wrapper>,
      );

      // the list should contain only the course run items, without the call to action button
      expect(screen.getAllByRole('listitem')).toHaveLength(2);

      // For each course run, it should render course, enrollment dates and a checkbox input
      // to select the course run
      courseRuns.forEach((courseRun: CourseRun) => {
        // - Course run start date should be displayed
        const $startDate = screen.getByTestId(`course-run-${courseRun.id}-start-date`);
        expect($startDate.textContent).toEqual(dateFormatter.format(new Date(courseRun.start)));

        // - Course run end date should be displayed
        const $endDate = screen.getByTestId(`course-run-${courseRun.id}-end-date`);
        expect($endDate.textContent).toEqual(dateFormatter.format(new Date(courseRun.end)));

        // - Course run enrollment dates should be displayed
        const $enrollmentDates = screen.getByTestId(`course-run-${courseRun.id}-enrollment-dates`);
        expect($enrollmentDates.textContent).toEqual(
          new Date(courseRun.enrollment_start) > new Date()
            ? // Enrollment is not yet opened
              `Enrollment from ${dateFormatter.format(new Date(courseRun.enrollment_start))}`
            : // Enrollment is open
              `Enrollment until ${dateFormatter.format(new Date(courseRun.enrollment_end))}`,
        );

        // - A radio input
        screen.getByRole('radio', {
          name: `Select course run from ${dateFormatter.format(
            new Date(courseRun.start),
          )} to ${dateFormatter.format(new Date(courseRun.end))}.`,
        });
      });

      // A call to action should be displayed
      let $button: HTMLButtonElement = screen.getByRole('button', {
        name: 'Enroll',
      });
      // the button should be enabled to provide feedback to user on what to do if he clicks it early
      expect($button.disabled).toBe(false);

      // when we click the button without selecting anything, an error should be displayed
      await act(async () => {
        fireEvent.click($button);
      });
      const error = screen.getByText('Select a course run');
      // the error should be focused so that screen reader users understand better
      expect(document.activeElement).toEqual(error);
      expect($button.disabled).toBe(false);

      // Once a course run is selected, it should be enabled and allows user to enroll
      await act(async () => {
        // - Select the first course run
        const $radio = screen.getByRole('radio', {
          name: `Select course run from ${dateFormatter.format(
            new Date(courseRuns[0].start),
          )} to ${dateFormatter.format(new Date(courseRuns[0].end))}.`,
        });
        fireEvent.click($radio);
      });

      $button = screen.getByRole('button', {
        name: 'Enroll',
      });
      expect($button.disabled).toBe(false);

      // - User clicks to enroll
      fetchMock.resetHistory();
      const enrollmentDeferred = new Deferred();
      fetchMock.post('https://joanie.test/api/v1.0/enrollments/', enrollmentDeferred.promise);

      await act(async () => {
        fireEvent.click($button);
      });

      // A spinner should be displayed
      screen.getByRole('status', { name: 'Enrolling...' });

      await act(async () => {
        enrollmentDeferred.resolve(HttpStatusCode.INTERNAL_SERVER_ERROR);
      });

      await screen.findByText(
        'An error occurred while creating the enrollment. Please retry later.',
      );
    });

    it('does not allow to enroll if course run is not opened for enrollment', async () => {
      const courseRun: CourseRun = CourseRunFactory({
        enrollment_start: faker.date.future({ years: 0.25 }).toISOString(),
        enrollment_end: faker.date.future({ years: 0.5 }).toISOString(),
        start: faker.date.future({ years: 0.75 }).toISOString(),
        end: faker.date.future({ years: 1.0 }).toISOString(),
        state: {
          priority: faker.helpers.arrayElement([
            Priority.FUTURE_NOT_YET_OPEN,
            Priority.FUTURE_CLOSED,
            Priority.ONGOING_CLOSED,
            Priority.ARCHIVED_CLOSED,
            Priority.TO_BE_SCHEDULED,
          ]),
          datetime: faker.date.future({ years: 0.25 }).toISOString(),
          call_to_action: undefined,
          text: CourseStateTextEnum.STARTING_ON,
        },
      }).one();
      const product = ProductFactory().one();
      product.contract_definition = undefined;
      const order = CredentialOrderFactory().one();

      render(
        <Wrapper>
          <EnrollableCourseRunList courseRuns={[courseRun]} order={order} product={product} />
        </Wrapper>,
      );

      // the list should contain only the course run items, without the call to action button
      expect(screen.getAllByRole('listitem')).toHaveLength(1);

      // For each course run, it should render course, enrollment dates and a checkbox input
      // to select the course run
      // - Course run start date should be displayed
      const $startDate = screen.getByTestId(`course-run-${courseRun.id}-start-date`);
      expect($startDate.textContent).toEqual(dateFormatter.format(new Date(courseRun.start)));

      // - Course run end date should be displayed
      const $endDate = screen.getByTestId(`course-run-${courseRun.id}-end-date`);
      expect($endDate.textContent).toEqual(dateFormatter.format(new Date(courseRun.end)));

      // - Course run enrollment dates should be displayed
      const $enrollmentDates = screen.getByTestId(`course-run-${courseRun.id}-enrollment-dates`);
      expect($enrollmentDates.textContent).toEqual(
        `Enrollment from ${dateFormatter.format(new Date(courseRun.enrollment_start))}`,
      );

      // - A radio input
      screen.getByRole('radio', {
        name: `Select course run from ${dateFormatter.format(
          new Date(courseRun.start),
        )} to ${dateFormatter.format(new Date(courseRun.end))}.`,
      });

      // A call to action should be displayed when no course run is selected
      const $button: HTMLButtonElement = screen.getByRole('button', {
        name: 'Enroll',
      });
      // it should be enabled already to allow early user feedback
      expect($button.disabled).toBe(false);

      fetchMock.post('https://joanie.test/api/v1.0/enrollments/', []);
      await act(async () => {
        // - Select the first course run
        const $radio = screen.getByRole('radio', {
          name: `Select course run from ${dateFormatter.format(
            new Date(courseRun.start),
          )} to ${dateFormatter.format(new Date(courseRun.end))}.`,
        });
        fireEvent.click($radio);
        fireEvent.click($button);
      });
      // - As the selected course run is not yet opened for enrollment,
      // a message should inform user that he/she cannot enroll now.
      // it should be focused so that screen reader users understand better
      // the submit button should stay enabled to always allow user feedback on its actions
      const error = await screen.findByText(
        `Enrollment will open on ${dateFormatter.format(new Date(courseRun.enrollment_start))}`,
      );
      expect(document.activeElement).toEqual(error);
      expect($button.disabled).toBe(false);
    });

    it('does not allow to enroll if a contract needs to be signed', async () => {
      const courseRun: CourseRun = CourseRunFactory({
        enrollment_start: faker.date.past({ years: 0.25 }).toISOString(),
        enrollment_end: faker.date.future({ years: 0.5 }).toISOString(),
        start: faker.date.future({ years: 0.75 }).toISOString(),
        end: faker.date.future({ years: 1.0 }).toISOString(),
        state: {
          priority: faker.helpers.arrayElement([
            Priority.FUTURE_NOT_YET_OPEN,
            Priority.FUTURE_CLOSED,
            Priority.ONGOING_CLOSED,
            Priority.ARCHIVED_CLOSED,
            Priority.TO_BE_SCHEDULED,
          ]),
          datetime: faker.date.future({ years: 0.25 }).toISOString(),
          call_to_action: undefined,
          text: CourseStateTextEnum.STARTING_ON,
        },
      }).one();
      const product = ProductFactory().one();
      const order = CredentialOrderFactory().one();

      render(
        <Wrapper>
          <EnrollableCourseRunList courseRuns={[courseRun]} order={order} product={product} />
        </Wrapper>,
      );

      // the list should contain only the course run items, without the call to action button
      expect(screen.getAllByRole('listitem')).toHaveLength(1);

      // For each course run, it should render course, enrollment dates and a checkbox input
      // to select the course run
      // - Course run start date should be displayed
      const $startDate = screen.getByTestId(`course-run-${courseRun.id}-start-date`);
      expect($startDate.textContent).toEqual(dateFormatter.format(new Date(courseRun.start)));

      // - Course run end date should be displayed
      const $endDate = screen.getByTestId(`course-run-${courseRun.id}-end-date`);
      expect($endDate.textContent).toEqual(dateFormatter.format(new Date(courseRun.end)));

      // - Course run enrollment dates should be displayed
      const $enrollmentDates = screen.getByTestId(`course-run-${courseRun.id}-enrollment-dates`);
      expect($enrollmentDates.textContent).toEqual(
        `Enrollment until ${dateFormatter.format(new Date(courseRun.enrollment_end))}`,
      );

      // - A radio input
      const $radio: HTMLInputElement = screen.getByRole('radio', {
        name: `Select course run from ${dateFormatter.format(
          new Date(courseRun.start),
        )} to ${dateFormatter.format(new Date(courseRun.end))}.`,
      });

      // The radio should be disabled as a contract needs to be signed.
      expect($radio).toBeDisabled();

      // A call to action should be displayed when no course run is selected
      const $button: HTMLButtonElement = screen.getByRole('button', {
        name: 'Enroll',
      });
      // it should be enabled already to allow early user feedback
      expect($button.disabled).toBe(true);
    });
  });

  describe('EnrolledCourseRun', () => {
    const Wrapper = ({ children }: PropsWithChildren<{}>) => (
      <IntlProvider locale="en">
        <QueryClientProvider client={createTestQueryClient()}>
          <JoanieApiProvider>{children}</JoanieApiProvider>
        </QueryClientProvider>
      </IntlProvider>
    );

    it('renders enrollment information', () => {
      const enrollment: Enrollment = EnrollmentFactory().one();

      render(
        <Wrapper>
          <EnrolledCourseRun enrollment={enrollment} />
        </Wrapper>,
      );

      // - It should render course dates,
      const $startDate = screen.getByTestId(`enrollment-${enrollment.id}-start-date`);
      expect($startDate.textContent).toEqual(
        dateFormatter.format(new Date(enrollment.course_run.start)),
      );
      const $endDate = screen.getByTestId(`enrollment-${enrollment.id}-start-date`);
      expect($endDate.textContent).toEqual(
        dateFormatter.format(new Date(enrollment.course_run.start)),
      );

      // "start" and "end" labels should be here but visually hidden for screen reader users
      const $offscreenStartDate = screen.getByTestId(
        `enrollment-${enrollment.id}-offscreen-start-date`,
      );
      const $offscreenEndDate = screen.getByTestId(
        `enrollment-${enrollment.id}-offscreen-end-date`,
      );
      expect($offscreenStartDate.textContent).toEqual('Start');
      expect($offscreenStartDate.classList.contains('offscreen')).toBe(true);
      expect($offscreenEndDate.textContent).toEqual('End');
      expect($offscreenEndDate.classList.contains('offscreen')).toBe(true);

      // - a link to access to the course,
      const $link: HTMLLinkElement = screen.getByRole('link', { name: 'Go to course' });
      expect($link).toHaveAttribute('href', enrollment.course_run.resource_link);
    });

    it('renders enrollment not started', async () => {
      const enrollment: Enrollment = EnrollmentFactory().one();
      const today = new Date();
      const startDate = new Date();
      startDate.setMonth(today.getMonth() + 2);

      const newEnrollment = {
        ...enrollment,
        course_run: {
          ...enrollment.course_run,
          start: startDate.toISOString(),
        },
      };

      render(
        <Wrapper>
          <EnrolledCourseRun enrollment={newEnrollment} />
        </Wrapper>,
      );

      await screen.getByText('You are enrolled');
      await screen.getByText('The course starts in 2 months');
    });
  });
});
