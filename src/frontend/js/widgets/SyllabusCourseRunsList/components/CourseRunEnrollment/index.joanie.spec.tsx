import { act, fireEvent, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';

import { faker } from '@faker-js/faker';
import { Deferred } from 'utils/test/deferred';
import { EnrollmentFactory as JoanieEnrollment } from 'utils/test/factories/joanie';
import {
  CourseRunFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { Priority } from 'types';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import { expectNoSpinner, expectSpinner } from 'utils/test/expectSpinner';
import CourseRunEnrollment from './index';

jest.mock('utils/errors/handle');

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: {
      endpoint: 'https://demo.endpoint',
      backend: 'fonzie',
    },
    lms_backends: [
      {
        backend: 'joanie',
        course_regexp: '^.*/api/v1.0((?:/(?:courses|course-runs|products)/[^/]+)+)/?$',
        endpoint: 'https://joanie.endpoint',
      },
    ],
    joanie_backend: {
      endpoint: 'https://joanie.endpoint',
    },
  }).one(),
}));

describe('<CourseRunEnrollment /> with joanie backend ', () => {
  setupJoanieSession();
  const endpoint = 'https://joanie.endpoint';

  beforeEach(() => {
    jest.useFakeTimers();
    sessionStorage.clear();
  });

  it('shows an "Enroll" button and allows the user to enroll', async () => {
    const courseRun = CourseRunFactory().one();
    courseRun.resource_link = `https://joanie.endpoint/api/v1.0/course-runs/${courseRun.id}`;

    const enrollmentDeferred = new Deferred();
    fetchMock.get(
      `${endpoint}/api/v1.0/enrollments/?course_run_id=${courseRun.id}`,
      enrollmentDeferred.promise,
    );

    render(<CourseRunEnrollment courseRun={courseRun} />);
    await expectSpinner('Loading enrollment information...');

    await act(async () => {
      enrollmentDeferred.resolve({
        count: 0,
        results: [],
      });
    });
    await expectNoSpinner('Loading enrollment information...');

    const button = await screen.findByRole('button', { name: 'Enroll now' });
    const enrollActionDeferred = new Deferred();
    fetchMock.post(`${endpoint}/api/v1.0/enrollments/`, enrollActionDeferred.promise);
    fireEvent.click(button);
    await act(async () => {
      enrollActionDeferred.resolve(true);
    });

    expect(await screen.findByText('Unenroll from this course')).toBeInTheDocument();
  });

  it('shows an error message when enrollment get request failed', async () => {
    const courseRun = CourseRunFactory().one();
    const joanieEnrollmentId = faker.string.uuid();
    courseRun.resource_link = `https://joanie.endpoint/api/v1.0/course-runs/${joanieEnrollmentId}`;

    fetchMock.get(
      `${endpoint}/api/v1.0/enrollments/?course_run_id=${joanieEnrollmentId}`,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );

    render(<CourseRunEnrollment courseRun={courseRun} />);

    expect(await screen.findByText('Enrollment fetching failed')).toBeInTheDocument();
  });

  it('shows a link to the course if the user is already enrolled', async () => {
    // Joanie session requests
    let nbApiCalls = 3;
    const joanieEnrollment = JoanieEnrollment({ is_active: true }).one();
    const courseRun = CourseRunFactory().one();
    courseRun.resource_link = `https://joanie.endpoint/api/v1.0/course-runs/${joanieEnrollment.course_run.id}/`;
    courseRun.state.priority = Priority.ONGOING_OPEN;

    fetchMock.get(
      `${endpoint}/api/v1.0/enrollments/?course_run_id=${joanieEnrollment.course_run.id}`,
      {
        count: 1,
        next: null,
        previous: null,
        results: [joanieEnrollment],
      },
    );
    nbApiCalls += 1;

    render(<CourseRunEnrollment courseRun={courseRun} />);

    const $goToCourseButton = await screen.findByRole('link', { name: 'Go to course' });
    expect($goToCourseButton).toBeInTheDocument();
    expect($goToCourseButton).toHaveAttribute('href', joanieEnrollment.course_run.resource_link);
    expect(screen.getByText('You are enrolled in this course run')).toBeInTheDocument();
    expect(fetchMock.calls()).toHaveLength(nbApiCalls);
  });

  it('shows an "Unenroll" text and allows the user to unenroll', async () => {
    const courseRun = CourseRunFactory().one();
    courseRun.resource_link = `https://joanie.endpoint/api/v1.0/course-runs/${courseRun.id}`;

    const enrollmentDeferred = new Deferred();
    fetchMock.get(
      `${endpoint}/api/v1.0/enrollments/?course_run_id=${courseRun.id}`,
      enrollmentDeferred.promise,
    );

    render(<CourseRunEnrollment courseRun={courseRun} />);
    await expectSpinner('Loading enrollment information...');

    await act(async () => {
      enrollmentDeferred.resolve({
        count: 1,
        results: [
          {
            course_run: courseRun,
            id: '57b35536-5c92-4606-bca3-13aa53d04d07',
            is_active: true,
            state: 'failed',
            was_created_by_order: false,
          },
        ],
      });
    });

    const enrollActionDeferred = new Deferred();
    fetchMock.put(
      `${endpoint}/api/v1.0/enrollments/57b35536-5c92-4606-bca3-13aa53d04d07/`,
      enrollActionDeferred.promise,
    );

    const unenroll = await screen.findByText('Unenroll from this course');
    fireEvent.click(unenroll);
    await act(async () => {
      enrollActionDeferred.resolve(false);
    });

    expect(await screen.findByRole('button', { name: 'Enroll now' })).toBeInTheDocument();
  });

  it('shows an error message when the enrollment fails', async () => {
    const courseRun = CourseRunFactory().one();
    courseRun.resource_link = `https://joanie.endpoint/api/v1.0/course-runs/${courseRun.id}`;

    const enrollmentDeferred = new Deferred();
    fetchMock.get(
      `${endpoint}/api/v1.0/enrollments/?course_run_id=${courseRun.id}`,
      enrollmentDeferred.promise,
    );

    render(<CourseRunEnrollment courseRun={courseRun} />);
    await expectSpinner('Loading enrollment information...');

    await act(async () => {
      enrollmentDeferred.resolve({
        count: 0,
        results: [],
      });
    });

    const button = await screen.findByRole('button', { name: 'Enroll now' });
    fetchMock.post(`${endpoint}/api/v1.0/enrollments/`, HttpStatusCode.INTERNAL_SERVER_ERROR);
    fireEvent.click(button);
    expect(await screen.findByText('Your enrollment request failed.')).toBeInTheDocument();
  });

  it('shows an error message when the unenrollment fails', async () => {
    const courseRun = CourseRunFactory().one();
    courseRun.resource_link = `https://joanie.endpoint/api/v1.0/course-runs/${courseRun.id}`;

    const enrollmentDeferred = new Deferred();
    fetchMock.get(
      `${endpoint}/api/v1.0/enrollments/?course_run_id=${courseRun.id}`,
      enrollmentDeferred.promise,
    );

    render(<CourseRunEnrollment courseRun={courseRun} />);
    await expectSpinner('Loading enrollment information...');

    await act(async () => {
      enrollmentDeferred.resolve({
        count: 1,
        results: [
          {
            course_run: courseRun,
            id: '57b35536-5c92-4606-bca3-13aa53d04d07',
            is_active: true,
            state: 'failed',
            was_created_by_order: false,
          },
        ],
      });
    });

    fetchMock.put(
      `${endpoint}/api/v1.0/enrollments/57b35536-5c92-4606-bca3-13aa53d04d07/`,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );

    const unenroll = await screen.findByText('Unenroll from this course');
    await act(async () => {
      fireEvent.click(unenroll);
    });

    await screen.findByText('Your unenrollment request failed.');
  });
});
