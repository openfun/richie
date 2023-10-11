import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { faker } from '@faker-js/faker';
import fetchMock from 'fetch-mock';
import { PropsWithChildren } from 'react';
import { CourseRun } from 'types';
import { Deferred } from 'utils/test/deferred';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
  CourseRunFactory,
} from 'utils/test/factories/richie';
import BaseSessionProvider from 'contexts/SessionContext/BaseSessionProvider';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { User } from 'types/User';
import useCourseEnrollment from 'widgets/SyllabusCourseRunsList/hooks/useCourseEnrollment/index';
import { HttpStatusCode } from 'utils/errors/HttpError';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
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
  }).one(),
}));

describe('useCourseEnrollment', () => {
  const endpoint = 'https://endpoint.test';
  const wrapper =
    (client: QueryClient) =>
    ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={client}>
        <BaseSessionProvider>{children}</BaseSessionProvider>
      </QueryClientProvider>
    );

  beforeEach(() => {
    fetchMock.restore();
  });

  it('does not make request when user is not authenticated', async () => {
    const user: User = UserFactory().one();
    const courseRun: CourseRun = CourseRunFactory().one();

    fetchMock.get(
      `${endpoint}/api/enrollment/v1/enrollment/${user.username},${courseRun.resource_link}`,
      HttpStatusCode.UNAUTHORIZED,
    );

    const { result } = renderHook(() => useCourseEnrollment(courseRun.resource_link), {
      wrapper: wrapper(createTestQueryClient({ user: null })),
    });

    expect(fetchMock.called()).toBeFalsy();
    expect(result.current.enrollment).toBeUndefined();
    expect(result.current.enrollmentIsActive).toBeUndefined();
  });

  it('retrieves enrollment when user is authenticated', async () => {
    const user: User = UserFactory().one();
    const courseRun: CourseRun = CourseRunFactory().one();

    const enrollmentResponse = { title: courseRun.id, is_active: faker.datatype.boolean() };
    const enrollementDefered = new Deferred();
    fetchMock.get(
      `${endpoint}/api/enrollment/v1/enrollment/${user.username},${courseRun.resource_link}`,
      enrollementDefered.promise,
    );

    const { result } = renderHook(() => useCourseEnrollment(courseRun.resource_link), {
      wrapper: wrapper(createTestQueryClient({ user })),
    });

    await act(async () => {
      enrollementDefered.resolve(enrollmentResponse);
    });

    expect(fetchMock.called()).toBeTruthy();
    await waitFor(() => expect(result.current.enrollment).toStrictEqual(enrollmentResponse));
    await waitFor(() =>
      expect(result.current.enrollmentIsActive).toStrictEqual(enrollmentResponse.is_active),
    );
  });
});
