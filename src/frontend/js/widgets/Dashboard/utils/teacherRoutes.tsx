import { useIntl } from 'react-intl';
import { Navigate, RouteObject } from 'react-router-dom';
import { TeacherOrganizationCourseDashboardLoader } from 'pages/TeacherOrganizationCourseDashboardLoader';
import { TeacherCoursesDashboardLoader } from 'pages/TeacherCoursesDashboardLoader';
import NavigateWithParams from 'widgets/Dashboard/components/NavigateWithParams';
import { getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';
import {
  TeacherDashboardPaths,
  TEACHER_DASHBOARD_ROUTE_LABELS,
} from 'widgets/Dashboard/utils/teacherRouteMessages';
import { TeacherCourseDashboardLoader } from 'pages/TeacherCourseDashboardLoader';
import { TeacherTrainingDashboardLoader } from 'pages/TeacherTrainingDashboard';

export function getTeacherDashboardRoutes() {
  const intl = useIntl();
  const getRoutePath = getDashboardRoutePath(intl);
  const routes: RouteObject[] = [
    {
      index: true,
      element: <Navigate to={getRoutePath(TeacherDashboardPaths.TEACHER_PROFILE)} replace />,
    },
    {
      path: getRoutePath(TeacherDashboardPaths.TEACHER_PROFILE),
      children: [
        {
          index: true,
          element: <Navigate to={getRoutePath(TeacherDashboardPaths.TEACHER_COURSES)} replace />,
        },
        {
          path: getRoutePath(TeacherDashboardPaths.TEACHER_COURSES),
          handle: {
            crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.TEACHER_COURSES],
          },
          element: <TeacherCoursesDashboardLoader />,
        },
      ],
    },
    {
      path: getRoutePath(TeacherDashboardPaths.ORGANIZATION, {
        organizationId: ':organizationId',
      }),
      children: [
        {
          index: true,
          element: (
            <NavigateWithParams
              to={getRoutePath(TeacherDashboardPaths.ORGANIZATION_COURSES, {
                organizationId: ':organizationId',
              })}
              replace
            />
          ),
        },
        {
          path: getRoutePath(TeacherDashboardPaths.ORGANIZATION_COURSES, {
            organizationId: ':organizationId',
          }),
          handle: {
            crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.ORGANIZATION_COURSES],
          },
          element: <TeacherOrganizationCourseDashboardLoader />,
        },
      ],
    },
    {
      path: getRoutePath(TeacherDashboardPaths.COURSE, {
        courseId: ':courseId',
      }),
      children: [
        {
          index: true,
          element: <TeacherCourseDashboardLoader />,
        },
        {
          path: getRoutePath(TeacherDashboardPaths.COURSE_PRODUCT, {
            courseId: ':courseId',
            courseProductRelationId: ':courseProductRelationId',
          }),
          handle: {
            crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE_PRODUCT],
          },
          element: <TeacherTrainingDashboardLoader />,
        },
      ],
    },
  ];

  return routes;
}
