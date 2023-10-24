import { PropsWithChildren } from 'react';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';

import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import { CourseListItemFactory } from 'utils/test/factories/joanie';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { User } from 'types/User';
import { Deferred } from 'utils/test/deferred';
import { PaginatedResourceQuery } from 'types/Joanie';
import { useCourses } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

interface RenderUseCoursesProps extends PropsWithChildren {
  user?: User;
  filters?: PaginatedResourceQuery;
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
    fetchMock.get('https://joanie.endpoint/api/v1.0/courses/', responseDeferred.promise);

    const user = UserFactory().one();
    const { result } = renderUseCourses({ user });

    await waitFor(() => {
      expect(result.current.states.fetching).toBe(true);
      expect(result.current.items).toEqual([]);
    });

    expect(result.current.states.creating).toBeUndefined();
    expect(result.current.states.deleting).toBeUndefined();
    expect(result.current.states.updating).toBeUndefined();
    expect(result.current.states.isPending).toBe(true);
    expect(result.current.states.error).toBeUndefined();

    const courses = CourseListItemFactory().many(3);
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
    expect(result.current.states.isPending).toBe(false);
    expect(result.current.states.error).toBeUndefined();
  });
});
