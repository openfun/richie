import fetchMock from 'fetch-mock';
import { screen } from '@testing-library/react';
import { createIntl } from 'react-intl';
import { CourseListItem } from 'types/Joanie';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import {
  TEACHER_DASHBOARD_ROUTE_LABELS,
  TeacherDashboardPaths,
} from 'widgets/Dashboard/utils/teacherRouteMessages';

import {
  CourseFactory,
  CourseProductRelationFactory,
  OrganizationFactory,
} from 'utils/test/factories/joanie';
import { expectNoSpinner } from 'utils/test/expectSpinner';
import { render } from 'utils/test/render';
import { setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { TeacherDashboardCourseSidebar, messages } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: { backend: 'fonzie', endpoint: 'https://demo.endpoint' },
    joanie_backend: { endpoint: 'https://joanie.endpoint' },
  }).one(),
}));

jest.mock('utils/indirection/window', () => ({
  location: {
    replace: jest.fn(),
  },
}));

const intl = createIntl({ locale: 'en' });

describe('<TeacherDashboardCourseSidebar/>', () => {
  const joanieSessionData = setupJoanieSession();
  let nbApiRequest: number;
  beforeEach(() => {
    nbApiRequest = joanieSessionData.nbSessionApiRequest;
  });

  it('should display syllabus link', async () => {
    const course: CourseListItem = CourseFactory().one();
    fetchMock.get(`https://joanie.endpoint/api/v1.0/courses/${course.id}/`, course);
    nbApiRequest += 1; // call to course

    render(<TeacherDashboardCourseSidebar />, {
      routerOptions: {
        path: '/:courseId',
        initialEntries: [`/${course.id}`],
      },
    });

    await expectNoSpinner('Loading course...');
    const link = screen.getByRole('link', {
      name: intl.formatMessage(messages.syllabusLinkLabel),
    });
    expect(link).toHaveAttribute('href', `/redirects/courses/${course.code}`);
  });

  it.each([
    {
      label: 'course',
      course: CourseFactory().one(),
      organization: undefined,
      courseProductRelation: undefined,
      expectedRoutes: [TeacherDashboardPaths.COURSE_GENERAL_INFORMATION],
    },
    {
      label: 'training',
      course: CourseFactory().one(),
      organization: undefined,
      courseProductRelation: CourseProductRelationFactory().one(),
      expectedRoutes: [
        TeacherDashboardPaths.COURSE_PRODUCT,
        TeacherDashboardPaths.COURSE_CONTRACTS,
        TeacherDashboardPaths.COURSE_PRODUCT_LEARNER_LIST,
      ],
    },
    {
      label: "organization's course",
      course: CourseFactory().one(),
      organization: OrganizationFactory().one(),
      courseProductRelation: undefined,
      expectedRoutes: [TeacherDashboardPaths.ORGANIZATION_COURSE_GENERAL_INFORMATION],
    },
    {
      label: "organization's training",
      course: CourseFactory().one(),
      organization: OrganizationFactory().one(),
      courseProductRelation: CourseProductRelationFactory().one(),
      expectedRoutes: [
        TeacherDashboardPaths.ORGANIZATION_PRODUCT,
        TeacherDashboardPaths.ORGANIZATION_PRODUCT_CONTRACTS,
        TeacherDashboardPaths.ORGANIZATION_COURSE_PRODUCT_LEARNER_LIST,
      ],
    },
  ])(
    'should display menu items for "$label" route',
    async ({ course, organization, courseProductRelation, expectedRoutes }) => {
      // mock api for organization's training
      if (organization && courseProductRelation) {
        // fetching training's contracts
        nbApiRequest += 1;
        fetchMock.get(
          `https://joanie.endpoint/api/v1.0/organizations/${organization.id}/contracts/?course_product_relation_id=${courseProductRelation.id}&signature_state=half_signed&page=1&page_size=25`,
          [],
        );
        // fetching organization's training
        nbApiRequest += 1;
        fetchMock.get(
          `https://joanie.endpoint/api/v1.0/organizations/${organization.id}/course-product-relations/${courseProductRelation.id}/`,
          courseProductRelation,
        );
      } else if (organization) {
        // fetching organization's course
        nbApiRequest += 1;
        fetchMock.get(
          `https://joanie.endpoint/api/v1.0/organizations/${organization.id}/courses/${course.id}/`,
          course,
        );
      } else if (courseProductRelation) {
        // fetching training
        nbApiRequest += 1;
        fetchMock.get(
          `https://joanie.endpoint/api/v1.0/course-product-relations/${courseProductRelation.id}/`,
          courseProductRelation,
        );
        nbApiRequest += 1;
        fetchMock.get(
          `https://joanie.endpoint/api/v1.0/organizations/?course_product_relation_id=${courseProductRelation.id}`,
          [],
        );
      } else {
        // mock api for course
        nbApiRequest += 1;
        fetchMock.get(`https://joanie.endpoint/api/v1.0/courses/${course.id}/`, course);
      }

      let routePath = '/:courseId';
      let initialEntry = `/${course.id}`;

      if (courseProductRelation) {
        routePath += '/:courseProductRelationId';
        initialEntry += `/${courseProductRelation.id}`;
      }
      if (organization) {
        routePath = '/:organizationId' + routePath;
        initialEntry = `/${organization.id}` + initialEntry;
      }

      render(<TeacherDashboardCourseSidebar />, {
        routerOptions: {
          path: routePath,
          initialEntries: [initialEntry],
        },
      });

      await expectNoSpinner('Loading course...');
      expectedRoutes.forEach((expectedRoute) => {
        expect(
          screen.getByRole('link', {
            name: intl.formatMessage(TEACHER_DASHBOARD_ROUTE_LABELS[expectedRoute]),
          }),
        ).toBeInTheDocument();
      });

      expect(screen.queryByTestId('organization-links')).not.toBeInTheDocument();

      let nbExpectedLinks = expectedRoutes.length;
      nbExpectedLinks += 1; // link to syllabus
      expect(screen.getAllByRole('link')).toHaveLength(nbExpectedLinks);
      expect(fetchMock.calls()).toHaveLength(nbApiRequest);
    },
  );
});
