import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';

import { CunninghamProvider } from '@openfun/cunningham-react';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { CourseListItemFactory, CourseProductRelationFactory } from 'utils/test/factories/joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { mockPaginatedResponse } from 'utils/test/mockPaginatedResponse';
import { PER_PAGE } from 'settings';
import { TeacherDashboardCoursesLoader } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('settings', () => ({
  __esModule: true,
  ...jest.requireActual('settings'),
  PER_PAGE: { useCourseProductUnion: 25 },
}));

jest.mock('hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: (props: any) => {
    (globalThis as any).__intersection_observer_props__ = props;
  },
}));

describe('components/TeacherDashboardCoursesLoader', () => {
  const perPage = PER_PAGE.useCourseProductUnion;
  let nbApiCalls: number;
  beforeEach(() => {
    // Joanie providers calls
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    // teacher course sidebar calls
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', []);

    nbApiCalls = 4;
  });

  it('should render', async () => {
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/?has_listed_course_runs=true&page=1&page_size=${perPage}`,
      mockPaginatedResponse(CourseListItemFactory().many(15), 15, false),
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/course-product-relations/?page=1&page_size=${perPage}`,
      mockPaginatedResponse(CourseProductRelationFactory().many(15), 15, false),
    );

    const user = UserFactory().one();
    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={createTestQueryClient({ user })}>
          <JoanieSessionProvider>
            <CunninghamProvider>
              <RouterProvider
                router={createMemoryRouter([
                  {
                    path: '',
                    element: <TeacherDashboardCoursesLoader />,
                  },
                ])}
              />
            </CunninghamProvider>
          </JoanieSessionProvider>
        </QueryClientProvider>
      </IntlProvider>,
    );
    await expectNoSpinner('Loading courses...');

    nbApiCalls += 1; // course api call
    nbApiCalls += 1; // course-product-relations api call
    const calledUrls = fetchMock.calls().map((call) => call[0]);
    expect(calledUrls).toHaveLength(nbApiCalls);
    expect(calledUrls).toContain(
      `https://joanie.endpoint/api/v1.0/course-product-relations/?page=1&page_size=${perPage}`,
    );

    // section titles
    expect(
      await screen.getByRole('heading', {
        name: 'Your courses',
      }),
    ).toBeInTheDocument();

    // Lessons
    expect(await screen.findAllByTestId('course-glimpse')).toHaveLength(25);
  });
});
