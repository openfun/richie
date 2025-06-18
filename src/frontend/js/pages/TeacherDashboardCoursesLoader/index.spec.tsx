import { screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import userEvent from '@testing-library/user-event';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { CourseListItemFactory, OfferFactory } from 'utils/test/factories/joanie';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { mockPaginatedResponse } from 'utils/test/mockPaginatedResponse';
import { PER_PAGE } from 'settings';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { render } from 'utils/test/render';
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
  const joanieSessionData = setupJoanieSession();
  const perPage = PER_PAGE.useCourseProductUnion;
  let nbApiCalls: number;
  beforeEach(() => {
    nbApiCalls = joanieSessionData.nbSessionApiRequest;

    // teacher course sidebar calls
    fetchMock.get('https://joanie.endpoint/api/v1.0/organizations/', []);
    nbApiCalls += 1;
  });

  it('should render', async () => {
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/?has_listed_course_runs=true&page=1&page_size=${perPage}`,
      mockPaginatedResponse(CourseListItemFactory().many(15), 15, false),
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/offers/?product_type=credential&page=1&page_size=${perPage}`,
      mockPaginatedResponse(OfferFactory().many(15), 15, false),
    );

    render(<TeacherDashboardCoursesLoader />);
    await expectNoSpinner('Loading courses...');

    nbApiCalls += 1; // course api call
    nbApiCalls += 1; // offers api call
    const calledUrls = fetchMock.calls().map((call) => call[0]);
    expect(calledUrls).toHaveLength(nbApiCalls);
    expect(calledUrls).toContain(
      `https://joanie.endpoint/api/v1.0/offers/?product_type=credential&page=1&page_size=${perPage}`,
    );

    // section titles
    expect(
      await screen.findByRole('heading', {
        name: 'Your courses',
      }),
    ).toBeInTheDocument();

    // Lessons
    expect(await screen.findAllByTestId('course-glimpse')).toHaveLength(25);
  });

  it('should perform search', async () => {
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/?has_listed_course_runs=true&page=1&page_size=${perPage}`,
      mockPaginatedResponse(CourseListItemFactory().many(15), 15, false),
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/offers/?product_type=credential&page=1&page_size=${perPage}`,
      mockPaginatedResponse(OfferFactory().many(15), 15, false),
    );

    render(<TeacherDashboardCoursesLoader />);
    await expectNoSpinner('Loading courses...');
    fetchMock.restore();

    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/courses/?query=text+query&has_listed_course_runs=true&page=1&page_size=${perPage}`,
      mockPaginatedResponse(CourseListItemFactory().many(5), 5, false),
    );
    fetchMock.get(
      `https://joanie.endpoint/api/v1.0/offers/?query=text+query&product_type=credential&page=1&page_size=${perPage}`,
      mockPaginatedResponse(OfferFactory().many(5), 5, false),
    );
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox', { name: /Search/ }), 'text query');
    await user.click(screen.getByRole('button', { name: /Search/ }));

    nbApiCalls = 1; // course api call
    nbApiCalls += 1; // offers api call
    const calledUrls = fetchMock.calls().map((call) => call[0]);
    expect(calledUrls).toHaveLength(nbApiCalls);
    expect(calledUrls).toContain(
      `https://joanie.endpoint/api/v1.0/courses/?query=text+query&has_listed_course_runs=true&page=1&page_size=${perPage}`,
    );
    expect(calledUrls).toContain(
      `https://joanie.endpoint/api/v1.0/offers/?query=text+query&product_type=credential&page=1&page_size=${perPage}`,
    );

    await waitFor(() => {
      expect(screen.getAllByTestId('course-glimpse')).toHaveLength(10);
    });
  });
});
