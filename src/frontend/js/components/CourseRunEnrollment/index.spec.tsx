import { act, fireEvent, render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { CourseRun } from 'types';
import { CommonDataProps } from 'types/commonDataProps';
import { Deferred } from 'utils/test/deferred';
import * as factories from 'utils/test/factories';

describe('<CourseRunEnrollment />', () => {
  const contextProps: CommonDataProps['context'] = factories.ContextFactory().generate();
  (window as any).__richie_frontend_context__ = { context: contextProps };
  const { CourseRunEnrollment } = require('.');

  afterEach(() => fetchMock.restore());

  it('shows an "Enroll" button and allows the user to enroll', async () => {
    const courseRun: CourseRun = factories.CourseRunFactory.generate();
    courseRun.state.priority = 0;

    const courseRunDeferred = new Deferred();
    fetchMock.get(`/api/v1.0/course-runs/${courseRun.id}/`, courseRunDeferred.promise);
    const userDeferred = new Deferred();
    fetchMock.get('/api/v1.0/users/whoami/', userDeferred.promise);
    const enrollmentsDeferred = new Deferred();
    fetchMock.get(`/api/v1.0/enrollments/?course_run=${courseRun.id}`, enrollmentsDeferred.promise);

    render(
      <IntlProvider locale="en">
        <CourseRunEnrollment
          context={contextProps}
          courseRunId={courseRun.id}
          loginUrl="/oauth/login/edx-oauth2/?next=/en/courses/"
        />
      </IntlProvider>,
    );
    screen.getByRole('status', { name: 'Loading enrollment information...' });

    await act(async () => {
      courseRunDeferred.resolve(courseRun);
      enrollmentsDeferred.resolve([]);
      userDeferred.resolve(factories.UserFactory.generate());
    });

    const button = screen.getByRole('button', { name: 'Enroll now' });

    const enrollActionDeferred = new Deferred();
    fetchMock.post('/api/v1.0/enrollments/', enrollActionDeferred.promise);
    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-busy', 'true');

    await act(async () => {
      enrollActionDeferred.resolve(factories.EnrollmentFactory.generate());
    });

    screen.getByRole('link', { name: 'Go to course' });
    screen.getByText('You are enrolled in this course run');
  });

  it('shows an error message and the enrollment button when the enrollment fails', async () => {
    const courseRun: CourseRun = factories.CourseRunFactory.generate();
    courseRun.state.priority = 0;

    const courseRunDeferred = new Deferred();
    fetchMock.get(`/api/v1.0/course-runs/${courseRun.id}/`, courseRunDeferred.promise);
    const userDeferred = new Deferred();
    fetchMock.get('/api/v1.0/users/whoami/', userDeferred.promise);
    const enrollmentsDeferred = new Deferred();
    fetchMock.get(`/api/v1.0/enrollments/?course_run=${courseRun.id}`, enrollmentsDeferred.promise);

    render(
      <IntlProvider locale="en">
        <CourseRunEnrollment
          context={contextProps}
          courseRunId={courseRun.id}
          loginUrl="/oauth/login/edx-oauth2/?next=/en/courses/"
        />
      </IntlProvider>,
    );
    screen.getByRole('status', { name: 'Loading enrollment information...' });

    await act(async () => {
      courseRunDeferred.resolve(courseRun);
      enrollmentsDeferred.resolve([]);
      userDeferred.resolve(factories.UserFactory.generate());
    });

    const button = screen.getByRole('button', { name: 'Enroll now' });

    const enrollActionDeferred = new Deferred();
    fetchMock.post('/api/v1.0/enrollments/', enrollActionDeferred.promise);
    fireEvent.click(button);

    await act(async () => {
      enrollActionDeferred.reject(500);
    });

    screen.getByRole('button', { name: 'Enroll now' });
    screen.getByText('Your enrollment request failed.');
  });

  it('shows a link to the course if the user is already enrolled', async () => {
    const courseRun: CourseRun = factories.CourseRunFactory.generate();
    courseRun.state.priority = 0;

    const courseRunDeferred = new Deferred();
    fetchMock.get(`/api/v1.0/course-runs/${courseRun.id}/`, courseRunDeferred.promise);
    const userDeferred = new Deferred();
    fetchMock.get('/api/v1.0/users/whoami/', userDeferred.promise);
    const enrollmentsDeferred = new Deferred();
    fetchMock.get(`/api/v1.0/enrollments/?course_run=${courseRun.id}`, enrollmentsDeferred.promise);

    render(
      <IntlProvider locale="en">
        <CourseRunEnrollment
          context={contextProps}
          courseRunId={courseRun.id}
          loginUrl="/oauth/login/edx-oauth2/?next=/en/courses/"
        />
      </IntlProvider>,
    );
    screen.getByRole('status', { name: 'Loading enrollment information...' });

    await act(async () => {
      courseRunDeferred.resolve(courseRun);
      enrollmentsDeferred.resolve([
        { ...factories.EnrollmentFactory.generate(), course_run: courseRun.id },
      ]);
      userDeferred.resolve(factories.UserFactory.generate());
    });

    screen.getByRole('link', { name: 'Go to course' });
    screen.getByText('You are enrolled in this course run');
  });

  it('shows a helpful message if the course run is closed', async () => {
    const courseRun: CourseRun = factories.CourseRunFactory.generate();
    courseRun.state.priority = 4;

    const courseRunDeferred = new Deferred();
    fetchMock.get(`/api/v1.0/course-runs/${courseRun.id}/`, courseRunDeferred.promise);
    const userDeferred = new Deferred();
    fetchMock.get('/api/v1.0/users/whoami/', userDeferred.promise);
    const enrollmentsDeferred = new Deferred();
    fetchMock.get(`/api/v1.0/enrollments/?course_run=${courseRun.id}`, enrollmentsDeferred.promise);

    render(
      <IntlProvider locale="en">
        <CourseRunEnrollment
          context={contextProps}
          courseRunId={courseRun.id}
          loginUrl="/oauth/login/edx-oauth2/?next=/en/courses/"
        />
      </IntlProvider>,
    );
    screen.getByRole('status', { name: 'Loading enrollment information...' });

    await act(async () => {
      courseRunDeferred.resolve(courseRun);
      enrollmentsDeferred.resolve([]);
      userDeferred.resolve(factories.UserFactory.generate());
    });

    screen.getByText('Enrollment in this course run is closed at the moment');
    expect(screen.queryByRole('button', { name: 'Enroll now' })).toBeNull();
  });

  it('prompts anonymous users to log in', async () => {
    const courseRun: CourseRun = factories.CourseRunFactory.generate();
    courseRun.state.priority = 0;

    const courseRunDeferred = new Deferred();
    fetchMock.get(`/api/v1.0/course-runs/${courseRun.id}/`, courseRunDeferred.promise);
    const enrollmentsDeferred = new Deferred();
    fetchMock.get(`/api/v1.0/enrollments/?course_run=${courseRun.id}`, enrollmentsDeferred.promise);
    fetchMock.get('/api/v1.0/users/whoami/', 401);

    render(
      <IntlProvider locale="en">
        <CourseRunEnrollment
          context={contextProps}
          courseRunId={courseRun.id}
          loginUrl="/oauth/login/edx-oauth2/?next=/en/courses/"
        />
      </IntlProvider>,
    );
    screen.getByRole('status', { name: 'Loading enrollment information...' });

    await act(async () => {
      courseRunDeferred.resolve(courseRun);
      enrollmentsDeferred.resolve([]);
    });

    screen.getByRole('link', { name: 'Log in to enroll' });
  });
});
