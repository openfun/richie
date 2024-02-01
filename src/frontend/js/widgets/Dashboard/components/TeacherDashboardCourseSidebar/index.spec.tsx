import fetchMock from 'fetch-mock';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { IntlProvider, createIntl } from 'react-intl';
import { QueryClientProvider } from '@tanstack/react-query';
import { CunninghamProvider } from '@openfun/cunningham-react';
import { PropsWithChildren } from 'react';
import { CourseListItem, CourseProductRelation, Organization } from 'types/Joanie';
import {
  RichieContextFactory as mockRichieContextFactory,
  UserFactory,
} from 'utils/test/factories/richie';
import {
  TEACHER_DASHBOARD_ROUTE_LABELS,
  TeacherDashboardPaths,
} from 'widgets/Dashboard/utils/teacherRouteMessages';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieSessionProvider from 'contexts/SessionContext/JoanieSessionProvider';

import {
  CourseFactory,
  CourseProductRelationFactory,
  OrganizationFactory,
} from 'utils/test/factories/joanie';
import { expectNoSpinner } from 'utils/test/expectSpinner';
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

interface RenderTeacherDashboardCourseSidebarProps {
  courseId: CourseListItem['id'];
  organizationId?: Organization['id'];
  courseProductRelationId?: CourseProductRelation['id'];
}

const Wrapper = ({
  children,
  courseId,
  organizationId,
  courseProductRelationId,
}: PropsWithChildren<RenderTeacherDashboardCourseSidebarProps>) => {
  let routePath = '/:courseId';
  let initialEntry = `/${courseId}`;

  if (courseProductRelationId) {
    routePath += '/:courseProductRelationId';
    initialEntry += `/${courseProductRelationId}`;
  }
  if (organizationId) {
    routePath = '/:organizationId' + routePath;
    initialEntry = `/${organizationId}` + initialEntry;
  }
  return (
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ user: UserFactory().one() })}>
        <JoanieSessionProvider>
          <CunninghamProvider>
            <MemoryRouter initialEntries={[initialEntry]}>
              <Routes>
                <Route path={routePath} element={children} />
              </Routes>
            </MemoryRouter>
          </CunninghamProvider>
        </JoanieSessionProvider>
      </QueryClientProvider>
    </IntlProvider>
  );
};

describe('<TeacherDashboardCourseSidebar/>', () => {
  let nbApiRequest: number;
  beforeEach(() => {
    // JoanieSessionProvider inital requests
    nbApiRequest = 3;
    fetchMock.get('https://joanie.endpoint/api/v1.0/orders/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/addresses/', []);
    fetchMock.get('https://joanie.endpoint/api/v1.0/credit-cards/', []);
  });
  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('should display syllabus link', async () => {
    const course: CourseListItem = CourseFactory().one();
    fetchMock.get(`https://joanie.endpoint/api/v1.0/courses/${course.id}/`, course);
    nbApiRequest += 1; // call to course

    render(
      <Wrapper courseId={course.id}>
        <TeacherDashboardCourseSidebar />
      </Wrapper>,
    );

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
      } else {
        // mock api for course
        nbApiRequest += 1;
        fetchMock.get(`https://joanie.endpoint/api/v1.0/courses/${course.id}/`, course);
      }

      render(
        <Wrapper
          courseId={course.id}
          courseProductRelationId={courseProductRelation ? courseProductRelation.id : undefined}
          organizationId={organization ? organization.id : undefined}
        >
          <TeacherDashboardCourseSidebar />
        </Wrapper>,
      );

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
