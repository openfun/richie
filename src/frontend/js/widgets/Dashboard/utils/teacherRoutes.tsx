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
      element: <Navigate to={getRoutePath(TeacherDashboardPaths.TEACHER_COURSES)} replace />,
    },
    {
      path: getRoutePath(TeacherDashboardPaths.TEACHER_COURSES),
      children: [
        {
          index: true,
          element: <TeacherCoursesDashboardLoader />,
        },
        {
          path: getRoutePath(TeacherDashboardPaths.COURSE, {
            courseId: ':courseId',
          }),
          children: [
            {
              index: true,
              element: (
                <NavigateWithParams
                  to={getRoutePath(TeacherDashboardPaths.COURSE_GENERAL_INFORMATION, {
                    courseId: ':courseId',
                  })}
                  replace
                />
              ),
            },
            {
              path: getRoutePath(TeacherDashboardPaths.COURSE_GENERAL_INFORMATION, {
                courseId: ':courseId',
              }),
              element: <TeacherCourseDashboardLoader />,
              handle: {
                crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE],
              },
            },
            {
              path: getRoutePath(TeacherDashboardPaths.COURSE_PRODUCT, {
                courseId: ':courseId',
                courseProductRelationId: ':courseProductRelationId',
              }),
              element: <TeacherTrainingDashboardLoader />,
              handle: {
                crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE],
              },
            },
          ],
        },
      ],
    },
    {
      path: getRoutePath(TeacherDashboardPaths.ORGANIZATION, {
        organizationId: ':organizationId',
      }),
      handle: {
        crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.ORGANIZATION],
      },
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
          children: [
            {
              index: true,
              element: <TeacherOrganizationCourseDashboardLoader />,
            },
            {
              path: getRoutePath(TeacherDashboardPaths.ORGANIZATION_COURSE_GENERAL_INFORMATION, {
                organizationId: ':organizationId',
                courseId: ':courseId',
              }),
              element: <TeacherCourseDashboardLoader />,
              handle: {
                crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE],
              },
            },
            {
              path: getRoutePath(TeacherDashboardPaths.ORGANIZATION_PRODUCT, {
                organizationId: ':organizationId',
                courseId: ':courseId',
                courseProductRelationId: ':courseProductRelationId',
              }),
              element: <TeacherTrainingDashboardLoader />,
              handle: {
                crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE],
              },
            },
          ],
        },
      ],
    },
  ];

  return routes;
}
