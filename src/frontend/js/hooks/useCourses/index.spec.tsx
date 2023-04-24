import { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { CourseFactory } from 'utils/test/factories/joanie';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { User } from 'types/User';
import { Deferred } from 'utils/test/deferred';
import { useCourses, TeacherCourseSearchFilters, CourseStatusFilter, CourseTypeFilter } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).generate(),
}));

interface RenderUseCoursesProps extends PropsWithChildren {
  user?: User;
  filters?: TeacherCourseSearchFilters;
}
const renderUseCourses = ({ user, filters }: RenderUseCoursesProps) => {
  const Wrapper = ({ children }: PropsWithChildren) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ user: user || null })}>
        <JoanieSessionProvider>{children}</JoanieSessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );
  return renderHook(() => useCourses(filters), { wrapper: Wrapper });
};

describe('hooks/useCourses', () => {
  beforeEach(() => {
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
  });

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('fetch all courses', async () => {
    const responseDeferred = new Deferred();
    fetchMock.get(
      'https://joanie.endpoint/api/v1.0/courses/?status=all&type=all',
      responseDeferred.promise,
    );

    const user = UserFactory.generate();
    const { result } = renderUseCourses({ user });

    await waitFor(() => {
      expect(result.current.states.fetching).toBe(true);
      expect(result.current.items).toEqual([]);
    });

    expect(result.current.states.creating).toBeUndefined();
    expect(result.current.states.deleting).toBeUndefined();
    expect(result.current.states.updating).toBeUndefined();
    expect(result.current.states.isLoading).toBe(true);
    expect(result.current.states.error).toBeUndefined();

    const courses = CourseFactory.generate(3);
    await act(async () => {
      responseDeferred.resolve(courses);
    });

    await waitFor(() => {
      expect(result.current.states.fetching).toBe(false);
      expect(JSON.stringify(result.current.items)).toBe(JSON.stringify(courses));
    });
    expect(result.current.states.creating).toBeUndefined();
    expect(result.current.states.deleting).toBeUndefined();
    expect(result.current.states.updating).toBeUndefined();
    expect(result.current.states.isLoading).toBe(false);
    expect(result.current.states.error).toBeUndefined();
  });

  it('fetch with filter "incoming"', async () => {
    const courseRuns = CourseFactory.generate(3);
    fetchMock.get('https://joanie.endpoint/api/v1.0/courses/?status=incoming&type=all', courseRuns);

    const user = UserFactory.generate();
    const filters: TeacherCourseSearchFilters = {
      status: CourseStatusFilter.INCOMING,
      type: CourseTypeFilter.ALL,
    };

    const { result } = renderUseCourses({ user, filters });
    await waitFor(() => {
      expect(result.current.states.fetching).toBe(false);
    });
    const calledUrls = fetchMock.calls().map((call) => call[0]);
    expect(calledUrls).toContain(
      'https://joanie.endpoint/api/v1.0/courses/?status=incoming&type=all',
    );
    expect(JSON.stringify(result.current.items)).toBe(JSON.stringify(courseRuns));
  });

  it('fetch with filter "ongoing"', async () => {
    const courseRuns = CourseFactory.generate(3);
    fetchMock.get('https://joanie.endpoint/api/v1.0/courses/?status=ongoing&type=all', courseRuns);

    const user = UserFactory.generate();
    const filters: TeacherCourseSearchFilters = {
      status: CourseStatusFilter.ONGOING,
      type: CourseTypeFilter.ALL,
    };

    const { result } = renderUseCourses({ user, filters });
    await waitFor(() => {
      expect(result.current.states.fetching).toBe(false);
    });
    const calledUrls = fetchMock.calls().map((call) => call[0]);
    expect(calledUrls).toContain(
      'https://joanie.endpoint/api/v1.0/courses/?status=ongoing&type=all',
    );
    expect(JSON.stringify(result.current.items)).toBe(JSON.stringify(courseRuns));
  });

  it('fetch with filter "archived"', async () => {
    const courseRuns = CourseFactory.generate(3);
    fetchMock.get('https://joanie.endpoint/api/v1.0/courses/?status=archived&type=all', courseRuns);

    const user = UserFactory.generate();
    const filters: TeacherCourseSearchFilters = {
      status: CourseStatusFilter.ARCHIVED,
      type: CourseTypeFilter.ALL,
    };

    const { result } = renderUseCourses({ user, filters });
    await waitFor(() => {
      expect(result.current.states.fetching).toBe(false);
    });
    const calledUrls = fetchMock.calls().map((call) => call[0]);
    expect(calledUrls).toContain(
      'https://joanie.endpoint/api/v1.0/courses/?status=archived&type=all',
    );
    expect(JSON.stringify(result.current.items)).toBe(JSON.stringify(courseRuns));
  });
});
