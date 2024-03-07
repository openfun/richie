import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';

import { CourseListItem } from 'types/Joanie';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { CourseListItemFactory } from 'utils/test/factories/joanieLegacy';
import { mockPaginatedResponse } from 'utils/test/mockPaginatedResponse';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { PER_PAGE } from 'settings';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
import TeacherDashboardCourseList from '.';

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

describe('components/TeacherDashboardCourseList', () => {
  const perPage = PER_PAGE.useCourseProductUnion;
  let nbApiCalls: number;
  const joanieSessionData = setupJoanieSession();
  beforeEach(() => {
    nbApiCalls = joanieSessionData.nbSessionApiRequest;
  });

  it('should render', async () => {
    const courseCooking: CourseListItem = CourseListItemFactory({
      title: 'One lesson about: How to cook birds',
    }).one();
    const courseDancing: CourseListItem = CourseListItemFactory({
      title: "One lesson about: Let's dance, the online lesson",
    }).one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/?has_listed_course_runs=true&page=1&page_size=${perPage}`,
      mockPaginatedResponse([courseCooking, courseDancing], 15, false),
    );
    const productCooking: CourseListItem = CourseListItemFactory({
      title: 'Full training: How to cook birds',
    }).one();
    const productDancing: CourseListItem = CourseListItemFactory({
      title: "Full training: Let's dance, the online lesson",
    }).one();
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/course-product-relations/?product_type=credential&page=1&page_size=${perPage}`,
      mockPaginatedResponse([productCooking, productDancing], 15, false),
    );

    render(<TeacherDashboardCourseList titleTranslated="TeacherDashboardCourseList test title" />);
    nbApiCalls += 1; // courses api call
    nbApiCalls += 1; // course-product-relations api call

    await expectNoSpinner('Loading courses...');
    expect(
      await screen.findByRole('heading', { name: /TeacherDashboardCourseList test title/ }),
    ).toBeInTheDocument();

    const calledUrls = fetchMock.calls().map((call) => call[0]);
    expect(calledUrls).toHaveLength(nbApiCalls);
    expect(calledUrls).toContain(
      `https://joanie.endpoint/api/v1.0/courses/?has_listed_course_runs=true&page=1&page_size=${perPage}`,
    );
    expect(calledUrls).toContain(
      `https://joanie.endpoint/api/v1.0/course-product-relations/?product_type=credential&page=1&page_size=${perPage}`,
    );

    expect(
      await screen.findByRole('heading', { name: /One lesson about: How to cook birds/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /One lesson about: Let's dance, the online lesson/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Full training: How to cook birds/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /Full training: Let's dance, the online lesson/ }),
    ).toBeInTheDocument();
  });

  it('should render empty list', async () => {
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/?has_listed_course_runs=true&page=1&page_size=${perPage}`,
      mockPaginatedResponse([], 0, false),
      {
        overwriteRoutes: true,
      },
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/course-product-relations/?product_type=credential&page=1&page_size=${perPage}`,
      mockPaginatedResponse([], 0, false),
      {
        overwriteRoutes: true,
      },
    );

    render(<TeacherDashboardCourseList titleTranslated="TeacherDashboardCourseList test title" />);
    nbApiCalls += 1; // courses api call
    nbApiCalls += 1; // course-product-relations api call
    await expectNoSpinner('Loading courses...');

    expect(await screen.getByRole('heading', { name: /TeacherDashboardCourseList test title/ }));

    const calledUrls = fetchMock.calls().map((call) => call[0]);
    expect(calledUrls).toContain(
      `https://joanie.endpoint/api/v1.0/courses/?has_listed_course_runs=true&page=1&page_size=${perPage}`,
    );
    expect(calledUrls).toContain(
      `https://joanie.endpoint/api/v1.0/course-product-relations/?product_type=credential&page=1&page_size=${perPage}`,
    );
    expect(calledUrls).toHaveLength(nbApiCalls);

    expect(await screen.findByText('You have no courses yet.')).toBeInTheDocument();
  });
});
