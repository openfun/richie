import {
  act,
  findByRole,
  getByRole,
  getByText,
  queryByText,
  queryByRole,
  screen,
  within,
} from '@testing-library/react';
import ReactDOM from 'react-dom';
import { createIntl } from 'react-intl';
import fetchMock from 'fetch-mock';
import userEvent from '@testing-library/user-event';
import { faker } from '@faker-js/faker';
import {
  CourseRunFactoryFromPriority,
  RichieContextFactory as mockRichieContextFactory,
  PacedCourseFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import SyllabusCourseRunsList from 'widgets/SyllabusCourseRunsList/index';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import { CourseRun, Priority } from 'types';
import { Offering } from 'types/Joanie';
import { OfferingFactory } from 'utils/test/factories/joanie';
import { DEFAULT_DATE_FORMAT } from 'hooks/useDateFormat';
import { StringHelper } from 'utils/StringHelper';
import { computeStates } from 'utils/CourseRuns';
import { IntlHelper } from 'utils/IntlHelper';
import { render } from 'utils/test/render';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { SyllabusCourseRunCompacted } from './components/SyllabusCourseRunCompacted';
import { SyllabusCourseRun } from './components/SyllabusCourseRun';

jest.mock('utils/context', () => {
  const mock = mockRichieContextFactory().one();
  mock.lms_backends = [
    {
      backend: 'joanie',
      course_regexp: '^.*/api/v1.0((?:/(?:courses|course-runs|products)/[^/]+)+)/?$',
      endpoint: 'https://joanie.endpoint',
    },
    {
      backend: 'openedx-hawthorn',
      course_regexp: '(https://openedx.endpoint.*)',
      endpoint: 'https://demo.endpoint',
    },
  ];
  mock.authentication = { backend: 'fonzie', endpoint: 'https://auth.test' };
  mock.joanie_backend = { endpoint: 'https://joanie.endpoint' };
  return {
    __esModule: true,
    default: mock,
  };
});

const MAX_ARCHIVED_COURSE_RUNS = 5;

describe('<SyllabusCourseRunsList/>', () => {
  let nbApiCalls: number;
  const joanieSessionData = setupJoanieSession();

  beforeAll(() => {
    // @ts-ignore
    ReactDOM.createPortal = jest.fn((element) => {
      return <div data-testid="portal">{element}</div>;
    });
  });

  beforeEach(() => {
    nbApiCalls = joanieSessionData.nbSessionApiRequest;
  });

  afterEach(() => {
    // @ts-ignore
    ReactDOM.createPortal.mockClear();
  });

  const getHeaderContainer = (): HTMLElement => {
    return document.querySelector('.course-detail__row')!;
  };

  const getPortalContainer = () => {
    return screen.getByTestId('portal');
  };

  const expectCourseRunInList = (container: HTMLElement, courseRun: CourseRun) => {
    const intl = createIntl({ locale: 'en' });
    const start = courseRun.start
      ? intl.formatDate(new Date(courseRun.start), DEFAULT_DATE_FORMAT)
      : '...';
    const end = intl.formatDate(new Date(courseRun.end), DEFAULT_DATE_FORMAT);
    getByText(container, `${courseRun.title}, from ${start} to ${end}`);
  };

  const expectCourseRunOpened = (container: HTMLElement, courseRun: CourseRun) => {
    [courseRun] = computeStates([courseRun]);
    const intl = createIntl({ locale: 'en' });
    const heading = getByRole(container, 'heading', {
      name: courseRun.title,
    });
    const runContainer = heading.parentNode! as HTMLElement;

    const enrollmentNode = getByText(runContainer, 'Enrollment');

    const enrollmentDatesContainer = enrollmentNode.nextSibling!;
    const enrollmentStart = intl.formatDate(
      new Date(courseRun.enrollment_start),
      DEFAULT_DATE_FORMAT,
    );
    const enrollmentEnd = intl.formatDate(new Date(courseRun.enrollment_end), DEFAULT_DATE_FORMAT);
    expect(enrollmentDatesContainer.textContent).toEqual(
      `From ${enrollmentStart} to ${enrollmentEnd}`,
    );

    const courseNode = enrollmentDatesContainer.nextSibling!;
    expect(courseNode.textContent).toEqual('Course');

    const start = intl.formatDate(new Date(courseRun.start), DEFAULT_DATE_FORMAT);
    const end = intl.formatDate(new Date(courseRun.end), DEFAULT_DATE_FORMAT);

    const datesContainer = courseNode.nextSibling!;
    expect(datesContainer.textContent).toEqual(`From ${start} to ${end}`);

    const languagesNode = datesContainer.nextSibling!;
    expect(languagesNode.textContent).toEqual('Languages');

    const languagesContainer = languagesNode.nextSibling! as HTMLElement;
    getByText(languagesContainer, IntlHelper.getLocalizedLanguages(courseRun.languages, intl));

    getByRole(runContainer, 'link', {
      name: StringHelper.capitalizeFirst(courseRun.state.call_to_action)!,
    });
  };

  const expectFullDates = (container: HTMLElement, courseRun: CourseRun) => {
    [courseRun] = computeStates([courseRun]);
    const intl = createIntl({ locale: 'en' });
    const heading = getByRole(container, 'heading', {
      name: courseRun.title,
    });
    const runContainer = heading.parentNode! as HTMLElement;

    const enrollmentNode = getByText(runContainer, 'Enrollment');

    const enrollmentDatesContainer = enrollmentNode.nextSibling!;
    const enrollmentStart = intl.formatDate(
      new Date(courseRun.enrollment_start),
      DEFAULT_DATE_FORMAT,
    );
    const enrollmentEnd = intl.formatDate(new Date(courseRun.enrollment_end), DEFAULT_DATE_FORMAT);
    expect(enrollmentDatesContainer.textContent).toEqual(
      `From ${enrollmentStart} to ${enrollmentEnd}`,
    );

    const courseNode = enrollmentDatesContainer.nextSibling!;
    expect(courseNode.textContent).toEqual('Course');

    const start = intl.formatDate(new Date(courseRun.start), DEFAULT_DATE_FORMAT);
    const end = intl.formatDate(new Date(courseRun.end), DEFAULT_DATE_FORMAT);

    const datesContainer = courseNode.nextSibling!;
    expect(datesContainer.textContent).toEqual(`From ${start} to ${end}`);
  };

  const expectCompactedDates = (container: HTMLElement, courseRun: CourseRun) => {
    [courseRun] = computeStates([courseRun]);
    const intl = createIntl({ locale: 'en' });
    const heading = getByRole(container, 'heading', {
      name: courseRun.title,
    });
    const runContainer = heading.parentNode! as HTMLElement;
    const courseDatesText = courseRun.end
      ? `Available until ${intl.formatDate(new Date(courseRun.end), DEFAULT_DATE_FORMAT)}`
      : `Available`;

    const courseDatesContainer = getByText(runContainer, courseDatesText);
    expect(courseDatesContainer).not.toBeNull();

    getByRole(runContainer, 'link', {
      name: StringHelper.capitalizeFirst(courseRun.state.call_to_action)!,
    });
  };

  const expectLanguageVisibility = (
    container: HTMLElement,
    courseRun: CourseRun,
    isLanguagesVisible: boolean,
  ) => {
    [courseRun] = computeStates([courseRun]);
    const intl = createIntl({ locale: 'en' });
    const heading = getByRole(container, 'heading', {
      name: courseRun.title,
    });

    const runContainer = heading.parentNode! as HTMLElement;

    const languagesNode = queryByText(runContainer, 'Languages');
    if (isLanguagesVisible) {
      expect(languagesNode).not.toBeNull();

      const languagesContainer = languagesNode?.nextSibling! as HTMLElement;
      getByText(languagesContainer, IntlHelper.getLocalizedLanguages(courseRun.languages, intl));
    } else {
      expect(languagesNode).toBeNull();
    }

    getByRole(runContainer, 'link', {
      name: StringHelper.capitalizeFirst(courseRun.state.call_to_action)!,
    });
  };

  const expectCourseProduct = async (container: HTMLElement, offering: Offering) => {
    const heading = await findByRole(container, 'heading', {
      name: offering.product.title,
    });
    expect(Array.from(heading.classList)).toContain('product-widget__title');
  };

  const expectEmptyPortalContainer = () => {
    // This way of testing is a bit hard but we are SURE that there is no other content. This way
    // we are also testing the absence of other elements.
    expect(getPortalContainer().textContent).toEqual('Other course runsNo other course runs');
  };

  it('has no opened course run', async () => {
    const course = PacedCourseFactory().one();
    const courseRuns = [
      CourseRunFactoryFromPriority(Priority.FUTURE_NOT_YET_OPEN)().one(),
      CourseRunFactoryFromPriority(Priority.FUTURE_CLOSED)({
        resource_link: 'https://openedx.endpoint/course-v1:edX+DemoX+Session1/info/',
      }).one(),
      CourseRunFactoryFromPriority(Priority.ONGOING_CLOSED)({
        resource_link: 'https://openedx.endpoint/course-v1:edX+DemoX+Session1/info/',
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)().one(),
      CourseRunFactoryFromPriority(Priority.TO_BE_SCHEDULED)().one(),
    ];

    render(
      <SyllabusCourseRunsList
        courseRuns={courseRuns}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );

    // Header.
    screen.getByText('No opened course runs');
    expect(getHeaderContainer().querySelectorAll('.course-detail__run-descriptions').length).toBe(
      0,
    );

    // Portal.
    // Expect that all other course runs all present.
    const portalContainer = getPortalContainer();
    courseRuns.forEach((run) => expectCourseRunInList(portalContainer, run));
  });

  it('has one opened course run', async () => {
    const course = PacedCourseFactory().one();
    const courseRuns = [
      CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)().one(),
      CourseRunFactoryFromPriority(Priority.FUTURE_CLOSED)({
        resource_link: 'https://openedx.endpoint/course-v1:edX+DemoX+Session1/info/',
      }).one(),
      CourseRunFactoryFromPriority(Priority.ONGOING_CLOSED)({
        resource_link: 'https://openedx.endpoint/course-v1:edX+DemoX+Session1/info/',
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)().one(),
      CourseRunFactoryFromPriority(Priority.TO_BE_SCHEDULED)().one(),
    ];

    render(
      <SyllabusCourseRunsList
        courseRuns={courseRuns}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );

    // Header.
    expect(getHeaderContainer().querySelectorAll('.course-detail__run-descriptions').length).toBe(
      1,
    );
    getByRole(getHeaderContainer(), 'heading', {
      name: courseRuns[0].title,
    });

    // Portal.
    // Expect that all other course runs all present.
    const portalContainer = getPortalContainer();
    courseRuns.slice(1).forEach((run) => expectCourseRunInList(portalContainer, run));
  });

  it('has one forever open course run', async () => {
    const course = PacedCourseFactory().one();
    const startDate = faker.date.past();
    const enrollmentStartDate = faker.date.past();
    const courseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      start: startDate.toISOString(),
      end: undefined,
      enrollment_start: enrollmentStartDate.toISOString(),
      enrollment_end: undefined,
      resource_link: 'https://openedx.endpoint/course-v1:edX+DemoX+Session1/info/',
    }).one();

    render(
      <SyllabusCourseRunsList
        courseRuns={[courseRun]}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );

    expect(getHeaderContainer().querySelectorAll('.course-detail__run-descriptions').length).toBe(
      1,
    );
    getByRole(getHeaderContainer(), 'heading', {
      name: courseRun.title,
    });
    // Make sure that CourseRunEnrollment is well rendered.
    getByRole(getHeaderContainer(), 'button', { name: 'Log in to enroll' });

    const intl = createIntl({ locale: 'en' });
    getByText(
      getHeaderContainer(),
      'From ' + intl.formatDate(enrollmentStartDate, DEFAULT_DATE_FORMAT) + ' to ...',
    );
    getByText(
      getHeaderContainer(),
      'From ' + intl.formatDate(startDate, DEFAULT_DATE_FORMAT) + ' to ...',
    );
  });
  it('has multiple opened course run', async () => {
    const course = PacedCourseFactory().one();
    const courseRuns = [
      CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)().one(),
      CourseRunFactoryFromPriority(Priority.FUTURE_OPEN)().one(),
      CourseRunFactoryFromPriority(Priority.FUTURE_CLOSED)({
        resource_link: 'https://openedx.endpoint/course-v1:edX+DemoX+Session1/info/',
      }).one(),
      CourseRunFactoryFromPriority(Priority.ONGOING_CLOSED)({
        resource_link: 'https://openedx.endpoint/course-v1:edX+DemoX+Session1/info/',
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)().one(),
      CourseRunFactoryFromPriority(Priority.TO_BE_SCHEDULED)().one(),
    ];

    render(
      <SyllabusCourseRunsList
        courseRuns={courseRuns}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );

    // Header.
    expect(getHeaderContainer().querySelectorAll('.course-detail__run-descriptions').length).toBe(
      0,
    );
    screen.getByText('2 course runs are currently open for this course');

    // Portal.
    // Expect that all course runs to be present.
    const portalContainer = getPortalContainer();
    courseRuns.slice(0, 2).forEach((run) => expectCourseRunOpened(portalContainer, run));
    courseRuns.slice(2).forEach((run) => expectCourseRunInList(portalContainer, run));
  });

  it('has one opened product', async () => {
    const course = PacedCourseFactory().one();
    const offering = OfferingFactory().one();
    const resourceLink = `https://joanie.endpoint/api/v1.0/courses/${course.code}/products/${offering.product.id}/`;
    fetchMock.get(resourceLink, offering);

    const courseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      resource_link: resourceLink,
    }).one();

    render(
      <SyllabusCourseRunsList
        courseRuns={[courseRun]}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );

    // Header.
    expect(getHeaderContainer().querySelectorAll('.course-detail__run-descriptions').length).toBe(
      1,
    );
    await expectCourseProduct(getHeaderContainer(), offering);

    // Portal.
    expectEmptyPortalContainer();
  });

  it('renders a specific title in portal when there is one opened course run', () => {
    const course = PacedCourseFactory().one();

    render(
      <SyllabusCourseRunsList
        courseRuns={[CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)().one()]}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );
    getByRole(getPortalContainer(), 'heading', {
      name: 'Other course runs',
    });
    expect(
      queryByRole(getPortalContainer(), 'heading', {
        name: 'Course runs',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders a specific title in portal when there are multiple opened course run', () => {
    const course = PacedCourseFactory().one();
    render(
      <SyllabusCourseRunsList
        courseRuns={[
          CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)().one(),
          CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)().one(),
        ]}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );
    getByRole(getPortalContainer(), 'heading', {
      name: 'Course runs',
    });
    expect(
      queryByRole(getPortalContainer(), 'heading', {
        name: 'Other course runs',
      }),
    ).not.toBeInTheDocument();
  });

  it('renders different categories correctly', async () => {
    const course = PacedCourseFactory().one();
    const courseRuns = [
      CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)().one(),
      CourseRunFactoryFromPriority(Priority.FUTURE_OPEN)().one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_OPEN)().one(),
      CourseRunFactoryFromPriority(Priority.FUTURE_NOT_YET_OPEN)().one(),
      CourseRunFactoryFromPriority(Priority.FUTURE_CLOSED)({
        resource_link: 'https://openedx.endpoint/course-v1:edX+DemoX+Session1/info/',
      }).one(),
      CourseRunFactoryFromPriority(Priority.ONGOING_CLOSED)({
        resource_link: 'https://openedx.endpoint/course-v1:edX+DemoX+Session1/info/',
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)().one(),
      CourseRunFactoryFromPriority(Priority.TO_BE_SCHEDULED)().one(),
    ];

    render(
      <SyllabusCourseRunsList
        courseRuns={courseRuns}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );

    getByRole(getPortalContainer(), 'heading', {
      name: 'Course runs',
    });
    expect(
      queryByRole(getPortalContainer(), 'heading', {
        name: 'Other course runs',
      }),
    ).not.toBeInTheDocument();

    const portalContainer = getPortalContainer();
    expectCourseRunOpened(portalContainer, courseRuns[0]);
    expectCourseRunOpened(portalContainer, courseRuns[1]);
    expectCourseRunOpened(portalContainer, courseRuns[2]);

    const toBeScheduledContainer = getByRole(portalContainer, 'heading', {
      name: 'To be scheduled',
    }).parentNode! as HTMLElement;
    expectCourseRunInList(toBeScheduledContainer, courseRuns[7]);

    const upcomingContainer = getByRole(portalContainer, 'heading', {
      name: 'Upcoming',
    }).parentNode! as HTMLElement;
    expectCourseRunInList(upcomingContainer, courseRuns[3]);

    const ongoingContainer = getByRole(portalContainer, 'heading', {
      name: 'Ongoing',
    }).parentNode! as HTMLElement;
    expectCourseRunInList(ongoingContainer, courseRuns[4]);
    expectCourseRunInList(ongoingContainer, courseRuns[5]);

    const archivedContainer = getByRole(portalContainer, 'heading', {
      name: 'Archived',
    }).parentNode! as HTMLElement;
    expectCourseRunInList(archivedContainer, courseRuns[6]);
  });

  it('renders an opened course run with an existing LMS Backend', () => {
    const course = PacedCourseFactory().one();
    const courseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)().one();
    courseRun.resource_link = 'https://openedx.endpoint' + courseRun.resource_link;

    render(
      <SyllabusCourseRunsList
        courseRuns={[courseRun]}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );

    // Header.
    expect(getHeaderContainer().querySelectorAll('.course-detail__run-descriptions').length).toBe(
      1,
    );
    getByRole(getHeaderContainer(), 'heading', {
      name: courseRun.title,
    });
    // Make sure that CourseRunEnrollment is well rendered.
    getByRole(getHeaderContainer(), 'button', { name: 'Log in to enroll' });
  });

  it('limits the amount of archived course runs displayed', async () => {
    const course = PacedCourseFactory().one();
    const courseRuns = [...Array(MAX_ARCHIVED_COURSE_RUNS * 2)]
      .map(() => CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)().one())
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));
    render(
      <SyllabusCourseRunsList
        courseRuns={courseRuns}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );

    const portalContainer = getPortalContainer();

    // Expect that 'is-hidden' class is set only to course runs in (MAX_ARCHIVED_COURSE_RUNS)nth-plus position.
    expect(portalContainer.querySelectorAll('li').length).toBe(MAX_ARCHIVED_COURSE_RUNS * 2);
    portalContainer.querySelectorAll('li').forEach((listElement, i) => {
      expectCourseRunInList(listElement, courseRuns[i]);
      if (i >= MAX_ARCHIVED_COURSE_RUNS) {
        expect(listElement.classList).toContain('is-hidden');
      } else {
        expect(listElement.classList).not.toContain('is-hidden');
      }
    });

    const button = screen.getByRole('button', { name: 'View more' });
    const user = userEvent.setup();

    // click on view more.
    await act(async () => user.click(button));

    // expect that 'is-hidden' are removed.
    portalContainer.querySelectorAll('li').forEach((listElement, i) => {
      expectCourseRunInList(listElement, courseRuns[i]);
      expect(listElement.classList).not.toContain('is-hidden');
    });

    expect(screen.queryByRole('button', { name: 'View more' })).not.toBeInTheDocument();
  });

  it('does not limit the amount of archived course runs displayed', async () => {
    const course = PacedCourseFactory().one();

    const courseRuns = [...Array(MAX_ARCHIVED_COURSE_RUNS - 1)]
      .map(() => CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)().one())
      .sort((a, b) => Date.parse(a.start) - Date.parse(b.start));

    render(
      <SyllabusCourseRunsList
        courseRuns={courseRuns}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );

    const portalContainer = getPortalContainer();
    expect(screen.queryByRole('button', { name: 'View more' })).not.toBeInTheDocument();

    // expect that 'is-hidden' is not set.
    expect(portalContainer.querySelectorAll('li').length).toBe(MAX_ARCHIVED_COURSE_RUNS - 1);
    portalContainer.querySelectorAll('li').forEach((listElement, i) => {
      expectCourseRunInList(listElement, courseRuns[i]);
      expect(listElement.classList).not.toContain('is-hidden');
    });
  });

  it('renders opened runs with the same locale as the user above', async () => {
    const course = PacedCourseFactory().one();

    const refDate = faker.date.future();
    const futureDate = (days: number) => {
      const date = new Date(refDate.getTime());
      date.setDate(date.getDate() + days);
      return date;
    };

    const courseRuns: CourseRun[] = [
      {
        ...CourseRunFactoryFromPriority(Priority.FUTURE_OPEN)().one(),
        languages: ['fr'],
        start: futureDate(1).toISOString(),
      },
      {
        ...CourseRunFactoryFromPriority(Priority.FUTURE_OPEN)().one(),
        languages: ['en'],
        start: futureDate(2).toISOString(),
      },
      {
        ...CourseRunFactoryFromPriority(Priority.FUTURE_OPEN)().one(),
        languages: ['mf'],
        start: futureDate(3).toISOString(),
      },
      {
        ...CourseRunFactoryFromPriority(Priority.FUTURE_OPEN)().one(),
        languages: ['en', 'fr'],
        start: futureDate(4).toISOString(),
      },
      {
        ...CourseRunFactoryFromPriority(Priority.FUTURE_OPEN)().one(),
        languages: ['it'],
        start: futureDate(5).toISOString(),
      },
    ];

    render(
      <SyllabusCourseRunsList
        courseRuns={courseRuns}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );

    const portalContainer = getPortalContainer();
    // Assert that they are all displayed.
    courseRuns.forEach((run) => expectCourseRunOpened(portalContainer, run));
    // Assert the order.
    // Order should be:
    // EN
    // EN, FR
    // FR
    // MF
    // IT
    const elements: NodeListOf<HTMLDivElement> = portalContainer.querySelectorAll(
      '.course-detail__run-descriptions',
    );
    expect(elements.length).toBe(courseRuns.length);
    expectCourseRunOpened(elements[0], courseRuns[1]);
    expectCourseRunOpened(elements[1], courseRuns[3]);
    expectCourseRunOpened(elements[2], courseRuns[0]);
    expectCourseRunOpened(elements[3], courseRuns[2]);
    expectCourseRunOpened(elements[4], courseRuns[4]);
  });

  it('renders instructor pace opened run with same languages', async () => {
    const course = PacedCourseFactory({ is_self_paced: false }).one();

    const courseRuns: CourseRun[] = [
      CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
        languages: ['en'],
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)({
        languages: ['en'],
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)({
        languages: ['en'],
      }).one(),
    ];

    render(
      <SyllabusCourseRunsList
        courseRuns={courseRuns}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );

    // Header of the opened run.
    expect(getHeaderContainer().querySelectorAll('.course-detail__run-descriptions').length).toBe(
      1,
    );

    // Assert that the run displays the extended dates.
    expectFullDates(getHeaderContainer(), courseRuns[0]);

    // Assert that the run does not display the containers related to languages.
    expectLanguageVisibility(getHeaderContainer(), courseRuns[0], false);

    const portalContainer = getPortalContainer();

    // Expect that all closed course runs to be present.
    courseRuns.slice(1).forEach((run) => expectCourseRunInList(portalContainer, run));
  });

  it('renders instructor pace opened run with different languages', async () => {
    const course = PacedCourseFactory({ is_self_paced: false }).one();

    const courseRuns: CourseRun[] = [
      CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
        languages: ['en'],
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)({
        languages: ['it'],
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)({
        languages: ['fr'],
      }).one(),
    ];

    render(
      <SyllabusCourseRunsList
        courseRuns={courseRuns}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );

    // Header of the opened run.
    expect(getHeaderContainer().querySelectorAll('.course-detail__run-descriptions').length).toBe(
      1,
    );

    // Assert that the run displays the extended dates.
    expectFullDates(getHeaderContainer(), courseRuns[0]);

    // Assert that the run displays its languages.
    expectLanguageVisibility(getHeaderContainer(), courseRuns[0], true);

    const portalContainer = getPortalContainer();

    // Expect that all closed course runs to be present.
    courseRuns.slice(1).forEach((run) => expectCourseRunInList(portalContainer, run));
  });

  it('renders self-paced opened run with different languages', async () => {
    const course = PacedCourseFactory({ is_self_paced: true }).one();

    const courseRuns = [
      CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
        languages: ['it'],
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)({
        languages: ['en'],
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)({
        languages: ['fr'],
      }).one(),
    ];

    render(
      <SyllabusCourseRunsList
        courseRuns={courseRuns}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );

    // Header of the opened run.
    expect(getHeaderContainer().querySelectorAll('.course-detail__run-descriptions').length).toBe(
      1,
    );

    // Assert that the run displays the containers related to the self-paced run dates.
    expectCompactedDates(getHeaderContainer(), courseRuns[0]);

    // Assert that the run displays the containers related to languages.
    expectLanguageVisibility(getHeaderContainer(), courseRuns[0], true);

    const portalContainer = getPortalContainer();

    // Expect that all closed course runs to be present.
    courseRuns.slice(1).forEach((run) => expectCourseRunInList(portalContainer, run));
  });

  it('renders self-paced opened run with same languages', async () => {
    const course = PacedCourseFactory({ is_self_paced: true }).one();

    const courseRuns: CourseRun[] = [
      CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
        languages: ['en'],
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)({
        languages: ['en'],
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)({
        languages: ['en'],
      }).one(),
    ];

    render(
      <SyllabusCourseRunsList
        courseRuns={courseRuns}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );

    // Header of the opened run.
    expect(getHeaderContainer().querySelectorAll('.course-detail__run-descriptions').length).toBe(
      1,
    );

    // Assert that the run displays the simplified version of dates
    expectCompactedDates(getHeaderContainer(), courseRuns[0]);

    // Assert that the run doesn't display the languages
    expectLanguageVisibility(getHeaderContainer(), courseRuns[0], false);

    const portalContainer = getPortalContainer();

    // Expect that all closed course runs to be present.
    courseRuns.slice(1).forEach((run) => expectCourseRunInList(portalContainer, run));
  });

  it('renders self-paced opened forever run with same languages', async () => {
    const course = PacedCourseFactory({ is_self_paced: true }).one();

    const courseRuns: CourseRun[] = [
      CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
        languages: ['en'],
        end: undefined,
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)({
        languages: ['en'],
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)({
        languages: ['en'],
      }).one(),
    ];

    render(
      <SyllabusCourseRunsList
        courseRuns={courseRuns}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );

    // Header of the opened run.
    expect(getHeaderContainer().querySelectorAll('.course-detail__run-descriptions').length).toBe(
      1,
    );

    // Assert that the run displays the simplified version of dates,
    // with hidden course end date.
    expectCompactedDates(getHeaderContainer(), courseRuns[0]);

    // Assert that the run doesn't display the languages
    expectLanguageVisibility(getHeaderContainer(), courseRuns[0], false);

    const portalContainer = getPortalContainer();

    // Expect that all closed course runs to be present.
    courseRuns.slice(1).forEach((run) => expectCourseRunInList(portalContainer, run));
  });

  it('renders course runs with snapshot link if needed', async () => {
    const course = PacedCourseFactory().one();
    const refDate = faker.date.past();
    const pastDate = (days: number) => {
      const date = new Date(refDate.getTime());
      date.setDate(date.getDate() + days);
      return date;
    };

    const courseRuns: CourseRun[] = [
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)({
        snapshot: faker.internet.url(),
        start: pastDate(1).toISOString(),
      }).one(),
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)({
        start: pastDate(2).toISOString(),
      }).one(),
    ];

    render(
      <SyllabusCourseRunsList
        courseRuns={courseRuns}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user: null }) },
      },
    );

    const portalContainer = getPortalContainer();
    expectCourseRunInList(portalContainer, courseRuns[0]);
    expectCourseRunInList(portalContainer, courseRuns[1]);

    const listElements = document.querySelectorAll('li');
    expect(listElements.length).toBe(2);

    // Assert the first course run is wrapped in a link.
    const link = within(listElements[0]).getByRole('link');
    expect(link.getAttribute('href')).toBe(courseRuns[0].snapshot);

    // Assert the second course run to not be wrapped in a link.
    expect(within(listElements[1]).queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders ongoing course runs with enrollment information', async () => {
    const user = UserFactory().one();
    const course = PacedCourseFactory().one();

    const onGoingCourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_CLOSED)({
      title: 'Ongoing course run',
      resource_link: 'https://openedx.endpoint/course-v1:edX+DemoX+Session2/info/',
    }).one();

    const courseRuns: CourseRun[] = [
      onGoingCourseRun,
      CourseRunFactoryFromPriority(Priority.ARCHIVED_CLOSED)({
        title: 'Closed course run',
        resource_link: 'https://openedx.endpoint/course-v1:edX+DemoX+Session1/info/',
      }).one(),
      CourseRunFactoryFromPriority(Priority.TO_BE_SCHEDULED)({
        title: 'To be scheduled course run',
        resource_link: 'https://openedx.endpoint/course-v1:edX+DemoX+Session4/info/',
      }).one(),
      CourseRunFactoryFromPriority(Priority.FUTURE_NOT_YET_OPEN)({
        title: 'Future course run',
        resource_link: 'https://openedx.endpoint/course-v1:edX+DemoX+Session3/info/',
      }).one(),
    ];

    courseRuns.forEach((courseRun) => {
      fetchMock.get(
        `https://demo.endpoint/api/enrollment/v1/enrollment/${user.username},${courseRun.resource_link}`,
        {
          is_active: true,
        },
      );
    });

    render(
      <SyllabusCourseRunsList
        courseRuns={courseRuns}
        course={course}
        maxArchivedCourseRuns={MAX_ARCHIVED_COURSE_RUNS}
      />,
      {
        queryOptions: { client: createTestQueryClient({ user }) },
      },
    );

    const portalContainer = getPortalContainer();
    expectCourseRunInList(portalContainer, courseRuns[0]);
    expectCourseRunInList(portalContainer, courseRuns[1]);
    expectCourseRunInList(portalContainer, courseRuns[2]);
    expectCourseRunInList(portalContainer, courseRuns[3]);

    const listElements = screen.getAllByRole('listitem');
    expect(listElements.length).toBe(4);

    // Assert there is only one link, one label 'Enrolled' and one request to retrieve enrollment.
    expect(await screen.findAllByText('Enrolled')).toHaveLength(1);

    const links = screen.getAllByRole('link');
    expect(links.length).toBe(1);
    const calledUrls = fetchMock.calls().map((call) => call[0]);
    expect(calledUrls).toHaveLength(nbApiCalls + 1);

    // Assert user's enrollment state has been checked for the ongoing course run.
    const link = within(portalContainer).getByRole('link');
    expect(link.getAttribute('href')).toBe(courseRuns[0].resource_link);
    expect(calledUrls).toContain(
      `https://demo.endpoint/api/enrollment/v1/enrollment/${user.username},${onGoingCourseRun.resource_link}`,
    );
  });

  it('renders price information as paid and paid on SyllabusCourseRunCompacted', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: 'paid',
      certificate_offer: 'paid',
      price_currency: 'EUR',
      price: 49.99,
      certificate_price: 59.99,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRunCompacted courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).toContain('<dd>Paid access<br>€49.99</dd>');
    expect(content).toContain('<dd>Paid certificate<br>€59.99</dd>');
  });

  it('renders price information as subscription on SyllabusCourseRunCompacted', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: 'Subscription',
      certificate_offer: 'Subscription',
      price_currency: 'EUR',
      price: 49.99,
      certificate_price: 59.99,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRunCompacted courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).toContain('<dd>Subscribe to access the course content<br>€49.99</dd>');
    expect(content).toContain('<dd>Offered certificate through subscription<br>€59.99</dd>');
  });

  it('renders price information as Partially free on SyllabusCourseRunCompacted', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: 'Partially free',
      certificate_offer: 'paid',
      price_currency: 'EUR',
      price: 0,
      certificate_price: 59.99,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRunCompacted courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).toContain('<dd>Partially free access<br>€0.00</dd>');
    expect(content).toContain('<dd>Paid certificate<br>€59.99</dd>');
  });

  it('renders price information as paid and free on SyllabusCourseRunCompacted', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: 'paid',
      certificate_offer: 'free',
      price_currency: 'EUR',
      price: 49.99,
      certificate_price: 0,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRunCompacted courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).toContain('<dd>Paid access<br>€49.99</dd>');
    expect(content).toContain('<dd>Free certificate<br>€0.00</dd>');
  });

  it('does not render price information on SyllabusCourseRunCompacted', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: undefined,
      certificate_offer: undefined,
      price: 59.99,
      certificate_price: 59.99,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRunCompacted courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).not.toContain('Paid access');
    expect(content).not.toContain('Paid certificate');
  });

  it('does not render course price information on SyllabusCourseRunCompacted', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      certificate_offer: 'paid',
      price_currency: 'EUR',
      offer: undefined,
      price: 59.99,
      certificate_price: 59.99,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRunCompacted courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).not.toContain('Paid access');
    expect(content).toContain('<dd>Paid certificate<br>€59.99</dd>');
  });

  it('does not render certificate price information on SyllabusCourseRunCompacted', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      price_currency: 'EUR',
      offer: 'paid',
      price: 49.99,
      certificate_offer: undefined,
      certificate_price: undefined,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRunCompacted courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).toContain('<dd>Paid access<br>€49.99</dd>');
    expect(content).not.toContain('Paid certificate');
  });

  it('does not render prices but only offers on SyllabusCourseRunCompacted', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: 'free',
      certificate_offer: 'free',
      price_currency: 'EUR',
      price: undefined,
      certificate_price: undefined,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRunCompacted courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).toContain('<dd>Free access<br></dd>');
    expect(content).toContain('<dd>Free certificate<br></dd>');
  });

  it('renders prices as zero on SyllabusCourseRunCompacted', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: 'free',
      certificate_offer: 'free',
      price_currency: 'EUR',
      price: 0,
      certificate_price: 0,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRunCompacted courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).toContain('<dd>Free access<br>€0.00</dd>');
    expect(content).toContain('<dd>Free certificate<br>€0.00</dd>');
  });

  it('does not render invalid offers on SyllabusCourseRunCompacted', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: 'invalid',
      certificate_offer: 'invalid',
      price_currency: 'EUR',
      price: 59.99,
      certificate_price: 59.99,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRunCompacted courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).not.toContain('The course content is');
    expect(content).not.toContain('The certification process is');
    expect(content).not.toContain('<br>€59.99');
  });

  it('renders price information as paid and paid on SyllabusCourseRun', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: 'paid',
      certificate_offer: 'paid',
      price_currency: 'EUR',
      price: 49.99,
      certificate_price: 59.99,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRun courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).toContain('<dd>Paid access<br>€49.99</dd>');
    expect(content).toContain('<dd>Paid certificate<br>€59.99</dd>');
  });

  it('renders price information as subscription on SyllabusCourseRun', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: 'Subscription',
      certificate_offer: 'Subscription',
      price_currency: 'EUR',
      price: 49.99,
      certificate_price: 59.99,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRun courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).toContain('<dd>Subscribe to access the course content<br>€49.99</dd>');
    expect(content).toContain('<dd>Offered certificate through subscription<br>€59.99</dd>');
  });

  it('renders price information as Partially free on SyllabusCourseRun', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: 'Partially free',
      certificate_offer: 'paid',
      price_currency: 'EUR',
      price: 0,
      certificate_price: 59.99,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRun courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).toContain('<dd>Partially free access<br>€0.00</dd>');
    expect(content).toContain('<dd>Paid certificate<br>€59.99</dd>');
  });

  it('renders price information as paid and free on SyllabusCourseRun', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: 'paid',
      certificate_offer: 'free',
      price_currency: 'EUR',
      price: 49.99,
      certificate_price: 0,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRun courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).toContain('<dd>Paid access<br>€49.99</dd>');
    expect(content).toContain('<dd>Free certificate<br>€0.00</dd>');
  });

  it('does not render price information on SyllabusCourseRun', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: undefined,
      certificate_offer: undefined,
      price: 59.99,
      certificate_price: 59.99,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRun courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).not.toContain('Paid access');
    expect(content).not.toContain('Paid certificate');
  });

  it('does not render course price information on SyllabusCourseRun', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: undefined,
      price: 59.99,
      price_currency: 'EUR',
      certificate_offer: 'paid',
      certificate_price: 59.99,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRun courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).not.toContain('Paid access');
    expect(content).toContain('<dd>Paid certificate<br>€59.99</dd>');
  });

  it('does not render certificate price information on SyllabusCourseRun', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      price_currency: 'EUR',
      offer: 'paid',
      price: 49.99,
      certificate_offer: undefined,
      certificate_price: undefined,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRun courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).toContain('<dd>Paid access<br>€49.99</dd>');
    expect(content).not.toContain('Paid certificate');
  });

  it('does not render prices but only offers on SyllabusCourseRun', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: 'free',
      certificate_offer: 'free',
      price_currency: 'EUR',
      price: undefined,
      certificate_price: undefined,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRun courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).toContain('<dd>Free access<br></dd>');
    expect(content).toContain('<dd>Free certificate<br></dd>');
  });

  it('renders prices as zero on SyllabusCourseRun', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: 'free',
      certificate_offer: 'free',
      price_currency: 'EUR',
      price: 0,
      certificate_price: 0,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRun courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).toContain('<dd>Free access<br>€0.00</dd>');
    expect(content).toContain('<dd>Free certificate<br>€0.00</dd>');
  });

  it('does not render invalid offers on SyllabusCourseRun', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      offer: 'invalid',
      certificate_offer: 'invalid',
      price_currency: 'EUR',
      price: 59.99,
      certificate_price: 59.99,
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRun courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).not.toContain('The course content is');
    expect(content).not.toContain('The certification process is');
    expect(content).not.toContain('<br>€59.99');
  });

  it('renders price discount on SyllabusCourseRun', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      price_currency: 'EUR',
      offer: 'paid',
      price: 49.99,
      certificate_offer: undefined,
      certificate_price: undefined,
      discounted_price: 30.0,
      discount: '-20%',
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRunCompacted courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).toContain(
      '<dd>Paid access<br><del>€49.99</del><span>&nbsp;(-20%)</span><br><strong>€30.00</strong></dd>',
    );
  });

  it('renders certificate discount on SyllabusCourseRun', async () => {
    const course = PacedCourseFactory().one();
    const courseRun: CourseRun = CourseRunFactoryFromPriority(Priority.ONGOING_OPEN)({
      languages: ['en'],
      price_currency: 'EUR',
      offer: 'free',
      price: undefined,
      certificate_offer: 'paid',
      certificate_price: 100.0,
      certificate_discounted_price: 70.0,
      certificate_discount: '-30%',
    }).one();

    render(
      <div className="course-detail__row course-detail__runs course-detail__runs--open">
        <SyllabusCourseRunCompacted courseRun={courseRun} course={course} showLanguages={false} />
      </div>,
    );

    const content = getHeaderContainer().innerHTML;
    expect(content).toContain(
      '<dd>Paid certificate<br><del>€100.00</del><span>&nbsp;(-30%)</span><br><strong>€70.00</strong></dd>',
    );
  });
});
