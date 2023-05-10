import { useIntl } from 'react-intl';
import { Navigate, RouteObject } from 'react-router-dom';
import { TeacherProfileSettingsDashboardLoader } from 'pages/TeacherProfileSettingsDashboardLoader';
import { TeacherOrganizationCourseDashboardLoader } from 'pages/TeacherOrganizationCourseDashboardLoader';
import RouteInfo from 'widgets/Dashboard/components/RouteInfo';
import { TeacherCoursesDashboardLoader } from 'pages/TeacherCoursesDashboardLoader';
import NavigateWithParams from 'widgets/Dashboard/components/NavigateWithParams';
import {
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'widgets/Dashboard/utils/dashboardRoutes';
import {
  TeacherDashboardPaths,
  TEACHER_DASHBOARD_ROUTE_LABELS,
} from 'widgets/Dashboard/utils/teacherRouteMessages';
import { TeacherCourseDashboardLoader } from 'pages/TeacherCourseDashboardLoader';

export function getTeacherDashboardRoutes() {
  const intl = useIntl();
  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);
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
        {
          path: getRoutePath(TeacherDashboardPaths.TEACHER_SETTINGS),
          handle: {
            crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.TEACHER_SETTINGS],
          },
          element: <TeacherProfileSettingsDashboardLoader />,
        },
        {
          path: getRoutePath(TeacherDashboardPaths.TEACHER_NOTIFICATIONS),
          handle: {
            crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.TEACHER_NOTIFICATIONS],
          },
          element: <RouteInfo title={getRouteLabel(TeacherDashboardPaths.TEACHER_NOTIFICATIONS)} />,
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
        {
          path: getRoutePath(TeacherDashboardPaths.ORGANIZATION_SETTINGS, {
            organizationId: ':organizationId',
          }),
          handle: {
            crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.ORGANIZATION_SETTINGS],
          },
          element: <RouteInfo title={getRouteLabel(TeacherDashboardPaths.ORGANIZATION_SETTINGS)} />,
        },
        {
          path: getRoutePath(TeacherDashboardPaths.ORGANIZATION_MEMBERS, {
            organizationId: ':organizationId',
          }),
          handle: {
            crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.ORGANIZATION_MEMBERS],
          },
          element: <RouteInfo title={getRouteLabel(TeacherDashboardPaths.ORGANIZATION_MEMBERS)} />,
        },
      ],
    },
    {
      path: getRoutePath(TeacherDashboardPaths.COURSE, {
        courseCode: ':courseCode',
      }),
      children: [
        {
          index: true,
          element: <TeacherCourseDashboardLoader />,
        },
        {
          path: getRoutePath(TeacherDashboardPaths.COURSE_SETTINGS, {
            courseCode: ':courseCode',
          }),
          handle: {
            crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE_SETTINGS],
          },
          element: <RouteInfo title={getRouteLabel(TeacherDashboardPaths.COURSE_SETTINGS)} />,
        },
        {
          path: getRoutePath(TeacherDashboardPaths.COURSE_CLASSROOMS, {
            courseCode: ':courseCode',
          }),
          handle: {
            crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE_CLASSROOMS],
          },
          element: <RouteInfo title={getRouteLabel(TeacherDashboardPaths.COURSE_CLASSROOMS)} />,
        },
        {
          path: getRoutePath(TeacherDashboardPaths.COURSE_RECORDS, {
            courseCode: ':courseCode',
          }),
          handle: {
            crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE_RECORDS],
          },
          element: <RouteInfo title={getRouteLabel(TeacherDashboardPaths.COURSE_RECORDS)} />,
        },
      ],
    },
  ];

  return routes;
}
