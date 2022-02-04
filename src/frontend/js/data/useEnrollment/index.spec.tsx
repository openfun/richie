import { act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { renderHook } from '@testing-library/react-hooks';
import faker from 'faker';
import fetchMock from 'fetch-mock';
import { PropsWithChildren } from 'react';
import { CourseRun } from 'types';
import { Deferred } from 'utils/test/deferred';
import { REACT_QUERY_SETTINGS } from 'settings';
import * as mockFactories from 'utils/test/factories';
import createQueryClient from 'utils/react-query/createQueryClient';
import BaseSessionProvider from 'data/SessionProvider/BaseSessionProvider';
import useEnrollment from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: {
        backend: 'openedx-hawthorn',
        endpoint: 'https://endpoint.test',
      },
      lms_backends: [
        {
          backend: 'openedx-hawthorn',
          course_regexp: '(.*)',
          endpoint: 'https://endpoint.test',
        },
      ],
    })
    .generate(),
}));

describe('useEnrollment', () => {
  const endpoint = 'https://endpoint.test';
  const wrapper = ({ client, children }: PropsWithChildren<{ client: QueryClient }>) => (
    <QueryClientProvider client={client}>
      <BaseSessionProvider>{children}</BaseSessionProvider>
    </QueryClientProvider>
  );

  const initializeUser = (loggedin = true) => {
    const username = faker.internet.userName();
    sessionStorage.setItem(
      REACT_QUERY_SETTINGS.cacheStorage.key,
      JSON.stringify(
        mockFactories.PersistedClientFactory({
          queries: [
            mockFactories.QueryStateFactory('user', { data: loggedin ? { username } : null }),
          ],
        }),
      ),
    );
    return loggedin ? username : null;
  };

  beforeEach(() => {
    sessionStorage.clear();
    fetchMock.restore();
  });

  it('does not make request when user is not authenticated', async () => {
    const username = initializeUser(false);
    const courseRun: CourseRun = mockFactories.CourseRunFactory.generate();

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
    const courseRun: CourseRun = mockFactories.CourseRunFactory.generate();
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
