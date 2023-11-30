import { act, fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';

import { Deferred } from 'utils/test/deferred';
import {
  CourseRunFactory,
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { SessionProvider } from 'contexts/SessionContext';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { HttpStatusCode } from 'utils/errors/HttpError';
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
  const endpoint = 'https://joanie.endpoint';

  beforeEach(() => {
    jest.useFakeTimers();
    sessionStorage.clear();
    fetchMock
      .get('https://joanie.endpoint/api/v1.0/addresses/', [])
      .get('https://joanie.endpoint/api/v1.0/credit-cards/', [])
      .get('https://joanie.endpoint/api/v1.0/orders/', []);
  });

  afterEach(() => {
    fetchMock.restore();
  });
  it('shows an "Enroll" button and allows the user to enroll', async () => {
    const user = UserFactory().one();
    const courseRun = CourseRunFactory().one();
    courseRun.resource_link = `https://joanie.endpoint/api/v1.0/course-runs/${courseRun.id}`;

    const enrollmentDeferred = new Deferred();
    fetchMock.get(
      `${endpoint}/api/v1.0/enrollments/?course_run_id=${courseRun.id}`,
      enrollmentDeferred.promise,
    );

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <CourseRunEnrollment courseRun={courseRun} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    screen.getByRole('status', { name: 'Loading enrollment information...' });

    await act(async () => {
      enrollmentDeferred.resolve({
        count: 0,
        results: [],
      });
    });

    const button = await screen.findByRole('button', { name: 'Enroll now' });
    const enrollActionDeferred = new Deferred();
    fetchMock.post(`${endpoint}/api/v1.0/enrollments/`, enrollActionDeferred.promise);
    fireEvent.click(button);
    await act(async () => {
      enrollActionDeferred.resolve(true);
    });
    await screen.findByText('Unenroll from this course');
  });

  it('shows an error message when enrollment get request failed', async () => {
    const user = UserFactory().one();
    const courseRun = CourseRunFactory().one();
    courseRun.resource_link = `https://joanie.endpoint/api/v1.0/course-runs/${courseRun.id}`;

    fetchMock.get(
      `${endpoint}/api/v1.0/enrollments/?course_run=${courseRun.id}`,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <CourseRunEnrollment courseRun={courseRun} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    await screen.findByText('Enrollment fetching failed');
  });

  it('shows an "Unenroll" text and allows the user to unenroll', async () => {
    const user = UserFactory().one();
    const courseRun = CourseRunFactory().one();
    courseRun.resource_link = `https://joanie.endpoint/api/v1.0/course-runs/${courseRun.id}`;

    const enrollmentDeferred = new Deferred();
    fetchMock.get(
      `${endpoint}/api/v1.0/enrollments/?course_run_id=${courseRun.id}`,
      enrollmentDeferred.promise,
    );

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <CourseRunEnrollment courseRun={courseRun} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    screen.getByRole('status', { name: 'Loading enrollment information...' });

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

    await screen.findByRole('button', { name: 'Enroll now' });
  });

  it('shows an error message when the enrollment fails', async () => {
    const user = UserFactory().one();
    const courseRun = CourseRunFactory().one();
    courseRun.resource_link = `https://joanie.endpoint/api/v1.0/course-runs/${courseRun.id}`;

    const enrollmentDeferred = new Deferred();
    fetchMock.get(
      `${endpoint}/api/v1.0/enrollments/?course_run_id=${courseRun.id}`,
      enrollmentDeferred.promise,
    );

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <CourseRunEnrollment courseRun={courseRun} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    screen.getByRole('status', { name: 'Loading enrollment information...' });
    await act(async () => {
      enrollmentDeferred.resolve({
        count: 0,
        results: [],
      });
    });

    const button = await screen.findByRole('button', { name: 'Enroll now' });
    fetchMock.post(`${endpoint}/api/v1.0/enrollments/`, HttpStatusCode.INTERNAL_SERVER_ERROR);
    await act(async () => {
      fireEvent.click(button);
    });
    await screen.findByText('Your enrollment request failed.');
  });

  it('shows an error message when the unenrollment fails', async () => {
    const user = UserFactory().one();
    const courseRun = CourseRunFactory().one();
    courseRun.resource_link = `https://joanie.endpoint/api/v1.0/course-runs/${courseRun.id}`;

    const enrollmentDeferred = new Deferred();
    fetchMock.get(
      `${endpoint}/api/v1.0/enrollments/?course_run_id=${courseRun.id}`,
      enrollmentDeferred.promise,
    );

    await act(async () => {
      render(
        <QueryClientProvider client={createTestQueryClient({ user })}>
          <IntlProvider locale="en">
            <SessionProvider>
              <CourseRunEnrollment courseRun={courseRun} />
            </SessionProvider>
          </IntlProvider>
        </QueryClientProvider>,
      );
    });

    screen.getByRole('status', { name: 'Loading enrollment information...' });

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
