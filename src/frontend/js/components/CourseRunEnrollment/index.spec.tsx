import { act, fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';
import faker from 'faker';

import { CourseRun } from 'types';
import { CommonDataProps } from 'types/commonDataProps';
import { Deferred } from 'utils/test/deferred';
import * as factories from 'utils/test/factories';
import { SESSION_CACHE_KEY } from 'settings';

describe('<CourseRunEnrollment />', () => {
  const endpoint = 'https://demo.endpoint';

  const contextProps: CommonDataProps['context'] = factories
    .ContextFactory({
      authentication: {
        endpoint,
        backend: 'richie.apps.courses.lms.edx.TokenEdXLMSBackend',
      },
      lms_backends: [
        {
          backend: 'richie.apps.courses.lms.edx.TokenEdXLMSBackend',
          course_regexp: '(?<course_id>.*)',
          endpoint,
          selector_regexp: '.*',
        },
      ],
    })
    .generate();
  (window as any).__richie_frontend_context__ = { context: contextProps };
  const { CourseRunEnrollment } = require('.');
  const { SessionProvider } = require('data/useSession');

  const initializeUser = (loggedin = true) => {
    const username = faker.internet.userName();
    sessionStorage.setItem(
      SESSION_CACHE_KEY,
      btoa(
        JSON.stringify({
          value: loggedin ? { username } : null,
          expiredAt: Date.now() + 60_0000,
        }),
      ),
    );
    return loggedin ? username : null;
  };

  afterEach(() => {
    sessionStorage.clear();
    fetchMock.restore();
  });

  it('shows an "Enroll" button and allows the user to enroll', async () => {
    const username = initializeUser();
    const courseRun: CourseRun = factories.CourseRunFactory.generate();
    courseRun.state.priority = 0;

    const courseRunDeferred = new Deferred();
    fetchMock.get(`/api/v1.0/course-runs/${courseRun.id}/`, courseRunDeferred.promise);
    const enrollmentsDeferred = new Deferred();
    fetchMock.get(
      `${endpoint}/api/enrollment/v1/enrollment/${username},${courseRun.resource_link}`,
      enrollmentsDeferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <SessionProvider>
          <CourseRunEnrollment context={contextProps} courseRunId={courseRun.id} />
        </SessionProvider>
      </IntlProvider>,
    );
    screen.getByRole('status', { name: 'Loading enrollment information...' });

    await act(async () => {
      courseRunDeferred.resolve(courseRun);
      enrollmentsDeferred.resolve({});
    });

    const button = screen.getByRole('button', { name: 'Enroll now' });

    const enrollActionDeferred = new Deferred();
    fetchMock.post(`${endpoint}/api/enrollment/v1/enrollment`, enrollActionDeferred.promise);
    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-busy', 'true');

    await act(async () => {
      enrollActionDeferred.resolve({ is_active: true });
    });

    screen.getByRole('link', { name: 'Go to course' });
    screen.getByText('You are enrolled in this course run');
  });

  it('shows an error message and the enrollment button when the enrollment fails', async () => {
    const username = initializeUser();
    const courseRun: CourseRun = factories.CourseRunFactory.generate();
    courseRun.state.priority = 0;

    const courseRunDeferred = new Deferred();
    fetchMock.get(`/api/v1.0/course-runs/${courseRun.id}/`, courseRunDeferred.promise);
    const enrollmentsDeferred = new Deferred();
    fetchMock.get(
      `${endpoint}/api/enrollment/v1/enrollment/${username},${courseRun.resource_link}`,
      enrollmentsDeferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <SessionProvider>
          <CourseRunEnrollment
            context={contextProps}
            courseRunId={courseRun.id}
            loginUrl="/oauth/login/edx-oauth2/?next=/en/courses/"
          />
        </SessionProvider>
      </IntlProvider>,
    );
    screen.getByRole('status', { name: 'Loading enrollment information...' });

    await act(async () => {
      courseRunDeferred.resolve(courseRun);
      enrollmentsDeferred.resolve(false);
    });

    const button = screen.getByRole('button', { name: 'Enroll now' });

    const enrollmentAction = new Deferred();
    fetchMock.post(`${endpoint}/api/enrollment/v1/enrollment`, enrollmentAction.promise);
    fireEvent.click(button);

    await act(async () => {
      enrollmentAction.reject();
    });

    screen.getByRole('button', { name: 'Enroll now' });
    screen.getByText('Your enrollment request failed.');
  });

  it('shows a link to the course if the user is already enrolled', async () => {
    const username = initializeUser();
    const courseRun: CourseRun = factories.CourseRunFactory.generate();
    courseRun.state.priority = 0;

    const courseRunDeferred = new Deferred();
    fetchMock.get(`/api/v1.0/course-runs/${courseRun.id}/`, courseRunDeferred.promise);
    const enrollmentsDeferred = new Deferred();
    fetchMock.get(
      `${endpoint}/api/enrollment/v1/enrollment/${username},${courseRun.resource_link}`,
      enrollmentsDeferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <SessionProvider>
          <CourseRunEnrollment context={contextProps} courseRunId={courseRun.id} />
        </SessionProvider>
      </IntlProvider>,
    );
    screen.getByRole('status', { name: 'Loading enrollment information...' });

    await act(async () => {
      courseRunDeferred.resolve(courseRun);
      enrollmentsDeferred.resolve({ is_active: true });
    });

    screen.getByRole('link', { name: 'Go to course' });
    screen.getByText('You are enrolled in this course run');
  });

  it('shows a helpful message if the course run is closed', async () => {
    initializeUser(false);
    const courseRun: CourseRun = factories.CourseRunFactory.generate();
    courseRun.state.priority = 4;

    const courseRunDeferred = new Deferred();
    fetchMock.get(`/api/v1.0/course-runs/${courseRun.id}/`, courseRunDeferred.promise);
    const enrollmentsDeferred = new Deferred();
    fetchMock.get(
      `${endpoint}/api/enrollment/v1/enrollment/${courseRun.resource_link}`,
      enrollmentsDeferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <SessionProvider>
          <CourseRunEnrollment context={contextProps} courseRunId={courseRun.id} />
        </SessionProvider>
      </IntlProvider>,
    );
    screen.getByRole('status', { name: 'Loading enrollment information...' });

    await act(async () => {
      courseRunDeferred.resolve(courseRun);
      enrollmentsDeferred.resolve(false);
    });

    screen.getByText('Enrollment in this course run is closed at the moment');
    expect(screen.queryByRole('button', { name: 'Enroll now' })).toBeNull();
  });

  it('prompts anonymous users to log in', async () => {
    initializeUser(false);
    const courseRun: CourseRun = factories.CourseRunFactory.generate();
    courseRun.state.priority = 0;

    const courseRunDeferred = new Deferred();
    fetchMock.get(`/api/v1.0/course-runs/${courseRun.id}/`, courseRunDeferred.promise);
    const enrollmentsDeferred = new Deferred();
    fetchMock.get(
      `${endpoint}/api/enrollment/v1/enrollment/${courseRun.resource_link}`,
      enrollmentsDeferred.promise,
    );

    render(
      <IntlProvider locale="en">
        <SessionProvider>
          <CourseRunEnrollment context={contextProps} courseRunId={courseRun.id} />
        </SessionProvider>
      </IntlProvider>,
    );
    screen.getByRole('status', { name: 'Loading enrollment information...' });

    await act(async () => {
      courseRunDeferred.resolve(courseRun);
      enrollmentsDeferred.resolve(false);
    });

    screen.getByRole('button', { name: 'Log in to enroll' });
  });
});
