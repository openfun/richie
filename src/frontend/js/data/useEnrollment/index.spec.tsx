import { act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { renderHook } from '@testing-library/react-hooks';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import React from 'react';
import { APIBackend } from 'types/api';
import { CommonDataProps } from 'types/commonDataProps';
import { CourseRun } from 'types';
import { Deferred } from 'utils/test/deferred';
import { REACT_QUERY_SETTINGS } from 'settings';
import * as factories from 'utils/test/factories';
import createQueryClient from 'utils/react-query/createQueryClient';

describe('useEnrollment', () => {
  const endpoint = 'https://endpoint.test';
  const contextProps: CommonDataProps['context'] = factories
    .ContextFactory({
      authentication: {
        backend: APIBackend.OPENEDX_HAWTHORN,
        endpoint,
      },
      lms_backends: [
        {
          backend: APIBackend.OPENEDX_HAWTHORN,
          course_regexp: '(.*)',
          endpoint,
        },
      ],
    })
    .generate();
  (window as any).__richie_frontend_context__ = { context: contextProps };
  const { SessionProvider } = require('data/useSession');
  const { default: useEnrollment } = require('.');
  const wrapper = ({ client, children }: React.PropsWithChildren<{ client: QueryClient }>) => (
    <QueryClientProvider client={client}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );

  const initializeUser = (loggedin = true) => {
    const username = faker.internet.userName();
    sessionStorage.setItem(
      REACT_QUERY_SETTINGS.cacheStorage.key,
      JSON.stringify(
        factories.PersistedClientFactory({
          queries: [factories.QueryStateFactory('user', { data: loggedin ? { username } : null })],
        }),
      ),
    );
    return loggedin ? username : null;
  };

  afterEach(() => {
    sessionStorage.clear();
    fetchMock.restore();
  });

  it('does not make request when user is not authenticated', async () => {
    const username = initializeUser(false);
    const courseRun: CourseRun = factories.CourseRunFactory.generate();

    fetchMock.get(
      `${endpoint}/api/enrollment/v1/enrollment/${username},${courseRun.resource_link}`,
      401,
    );

    let client: QueryClient;
    await waitFor(() => {
      client = createQueryClient({ persistor: true });
    });

    const { result } = renderHook(() => useEnrollment(courseRun.resource_link), {
      wrapper,
      initialProps: { client: client! },
    });

    expect(fetchMock.called()).toBeFalsy();
    expect(result.current.enrollment).toBeUndefined();
    expect(result.current.enrollmentIsActive).toBeUndefined();
  });

  it('retrieves enrollment when user is authenticated', async () => {
    const username = initializeUser();
    const courseRun: CourseRun = factories.CourseRunFactory.generate();
    let client: QueryClient;
    await waitFor(() => {
      client = createQueryClient({ persistor: true });
    });

    const enrollmentResponse = { title: courseRun.id, is_active: faker.datatype.boolean() };
    const enrollementDefered = new Deferred();
    fetchMock.get(
      `${endpoint}/api/enrollment/v1/enrollment/${username},${courseRun.resource_link}`,
      enrollementDefered.promise,
    );

    const { result } = renderHook(() => useEnrollment(courseRun.resource_link), {
      wrapper,
      initialProps: { client: client! },
    });

    await act(async () => {
      enrollementDefered.resolve(enrollmentResponse);
    });

    expect(fetchMock.called()).toBeTruthy();
    expect(result.current.enrollment).toStrictEqual(enrollmentResponse);
    expect(result.current.enrollmentIsActive).toStrictEqual(enrollmentResponse.is_active);
  });
});
