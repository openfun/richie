import { screen } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import { CourseListItemFactory, CourseProductRelationFactory } from 'utils/test/factories/joanie';
import { render } from 'utils/test/render';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { expectNoSpinner, expectSpinner } from 'utils/test/expectSpinner';
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
  const joanieSessionData = setupJoanieSession();
  let nbApiCalls: number;
  beforeEach(() => {
    nbApiCalls = joanieSessionData.nbSessionApiRequest;
  });

  it('should render loading more state', async () => {
    const trainings = CourseProductRelationFactory().many(2);
    const courses = CourseListItemFactory().many(2);
    const courseAndProductList = [...courses, ...trainings];

    render(
      <TeacherDashboardCourseList
        titleTranslated="TeacherDashboardCourseList test title"
        isLoadingMore={true}
        loadMore={jest.fn()}
        courseAndProductList={courseAndProductList}
      />,
    );

    await expectSpinner('Loading courses...');
    expect(fetchMock.calls()).toHaveLength(nbApiCalls);

    courses.forEach((course) => {
      expect(screen.getByRole('heading', { name: course.title })).toBeInTheDocument();
    });
    trainings.forEach((training) => {
      expect(screen.getByRole('heading', { name: training.product.title })).toBeInTheDocument();
    });
  });

  it('should render courses and products list', async () => {
    const trainings = CourseProductRelationFactory().many(2);
    const courses = CourseListItemFactory().many(2);
    const courseAndProductList = [...courses, ...trainings];

    render(
      <TeacherDashboardCourseList
        titleTranslated="TeacherDashboardCourseList test title"
        loadMore={jest.fn()}
        courseAndProductList={courseAndProductList}
      />,
    );

    await expectNoSpinner('Loading courses...');

    expect(
      screen.getByRole('heading', { name: /TeacherDashboardCourseList test title/ }),
    ).toBeInTheDocument();

    expect(fetchMock.calls()).toHaveLength(nbApiCalls);

    courses.forEach((course) => {
      expect(screen.getByRole('heading', { name: course.title })).toBeInTheDocument();
    });
    trainings.forEach((training) => {
      expect(screen.getByRole('heading', { name: training.product.title })).toBeInTheDocument();
    });
  });

  it('should render empty list', async () => {
    render(
      <TeacherDashboardCourseList
        titleTranslated="TeacherDashboardCourseList test title"
        loadMore={jest.fn()}
        courseAndProductList={[]}
      />,
    );

    expect(await screen.getByRole('heading', { name: /TeacherDashboardCourseList test title/ }));
    expect(fetchMock.calls()).toHaveLength(nbApiCalls);
    expect(await screen.findByText('You have no courses yet.')).toBeInTheDocument();
  });
});
