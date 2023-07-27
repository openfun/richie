import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';

import { CunninghamProvider } from '@openfun/cunningham-react';
import { capitalize } from 'lodash-es';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';
import { CourseProductRelationFactory } from 'utils/test/factories/joanie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { DashboardBreadcrumbsProvider } from 'widgets/Dashboard/contexts/DashboardBreadcrumbsContext';
import { TeacherTrainingDashboardLoader } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('hooks/useIntersectionObserver', () => ({
  useIntersectionObserver: (props: any) => {
    (globalThis as any).__intersection_observer_props__ = props;
  },
}));

describe('components/TeacherTrainingDashboardLoader', () => {
  let nbApiCalls: number;
  beforeEach(() => {
    // Joanie providers calls
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    nbApiCalls = 3;
  });

  it('should render TeacherTrainingDashboardLoader page', async () => {
    const courseProductRelation = CourseProductRelationFactory().one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/course-product-relations/${courseProductRelation.id}/`,
      courseProductRelation,
    );

    const user = UserFactory().one();
    render(
      <IntlProvider locale="en">
        <QueryClientProvider client={createTestQueryClient({ user })}>
          <JoanieSessionProvider>
            <DashboardBreadcrumbsProvider>
              <CunninghamProvider>
                <RouterProvider
                  router={createMemoryRouter(
                    [
                      {
                        path: ':courseProductRelationId',
                        element: <TeacherTrainingDashboardLoader />,
                      },
                    ],
                    {
                      initialEntries: [`/${courseProductRelation.id}`],
                    },
                  )}
                />
              </CunninghamProvider>
            </DashboardBreadcrumbsProvider>
          </JoanieSessionProvider>
        </QueryClientProvider>
      </IntlProvider>,
    );
    // page placeholder
    await expectNoSpinner('Loading training...');
    // sidebar placeholder
    await expectNoSpinner('Loading course...');

    nbApiCalls += 1; // course-product-relations api call
    const calledUrls = fetchMock.calls().map((call) => call[0]);
    expect(calledUrls).toHaveLength(nbApiCalls);
    expect(calledUrls).toContain(
      `https://joanie.endpoint/api/v1.0/course-product-relations/${courseProductRelation.id}/`,
    );

    // main titles
    expect(
      screen.getByRole('heading', {
        name: 'Training area',
      }),
    ).toBeInTheDocument();

    expect(
      screen.getAllByRole('heading', { name: capitalize(courseProductRelation.product.title) }),
    ).toHaveLength(2);

    const nbCourseRun = courseProductRelation.product.target_courses.reduce(
      (acc, course) => acc + course.course_runs.length,
      0,
    );
    expect(screen.getAllByRole('link', { name: 'go to course area' })).toHaveLength(nbCourseRun);
  });
});
