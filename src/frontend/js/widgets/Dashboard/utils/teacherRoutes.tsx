import { useIntl } from 'react-intl';
import { Navigate, RouteObject } from 'react-router-dom';
import {
  TeacherDashboardCourseContractsLayout,
  TeacherDashboardOrganizationContractsLayout,
} from 'pages/TeacherDashboardContractsLayout';
import { TeacherDashboardOrganizationCourseLoader } from 'pages/TeacherDashboardOrganizationCourseLoader';
import { TeacherDashboardCoursesLoader } from 'pages/TeacherDashboardCoursesLoader';
import NavigateWithParams from 'widgets/Dashboard/components/NavigateWithParams';
import { getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';
import {
  TeacherDashboardPaths,
  TEACHER_DASHBOARD_ROUTE_LABELS,
} from 'widgets/Dashboard/utils/teacherRouteMessages';
import { TeacherDashboardCourseLoader } from 'pages/TeacherDashboardCourseLoader';
import { TeacherDashboardTrainingLoader } from 'pages/TeacherDashboardTraining';
import { TeacherDashboardCourseLearnersLayout } from 'pages/TeacherDashboardCourseLearnersLayout';

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
          element: <TeacherDashboardCoursesLoader />,
        },
        {
          path: getRoutePath(TeacherDashboardPaths.COURSE),
          children: [
            {
              index: true,
              element: (
                <NavigateWithParams
                  to={getRoutePath(TeacherDashboardPaths.COURSE_GENERAL_INFORMATION)}
                  replace
                />
              ),
            },
            {
              path: getRoutePath(TeacherDashboardPaths.COURSE_GENERAL_INFORMATION),
              element: <TeacherDashboardCourseLoader />,
              handle: {
                crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE],
              },
            },
            {
              path: getRoutePath(TeacherDashboardPaths.COURSE_PRODUCT),
              children: [
                {
                  index: true,
                  element: <TeacherDashboardTrainingLoader />,
                  handle: {
                    crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE],
                  },
                },
                {
                  path: getRoutePath(TeacherDashboardPaths.COURSE_PRODUCT_CONTRACTS),
                  element: <TeacherDashboardCourseContractsLayout />,
                  handle: {
                    crumbLabel:
                      TEACHER_DASHBOARD_ROUTE_LABELS[
                        TeacherDashboardPaths.COURSE_PRODUCT_CONTRACTS
                      ],
                  },
                },
                {
                  path: getRoutePath(TeacherDashboardPaths.COURSE_PRODUCT_LEARNER_LIST),
                  element: <TeacherDashboardCourseLearnersLayout />,
                  handle: {
                    crumbLabel:
                      TEACHER_DASHBOARD_ROUTE_LABELS[
                        TeacherDashboardPaths.COURSE_PRODUCT_LEARNER_LIST
                      ],
                  },
                },
              ],
            },
            {
              path: getRoutePath(TeacherDashboardPaths.COURSE_CONTRACTS),
              element: <TeacherDashboardCourseContractsLayout />,
              handle: {
                crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE_CONTRACTS],
              },
            },
          ],
        },
      ],
    },
    {
      path: getRoutePath(TeacherDashboardPaths.ORGANIZATION),
      handle: {
        crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.ORGANIZATION],
      },
      children: [
        {
          index: true,
          element: (
            <NavigateWithParams
              to={getRoutePath(TeacherDashboardPaths.ORGANIZATION_COURSES)}
              replace
            />
          ),
        },
        {
          path: getRoutePath(TeacherDashboardPaths.ORGANIZATION_COURSES),
          children: [
            {
              index: true,
              element: <TeacherDashboardOrganizationCourseLoader />,
            },
            {
              path: getRoutePath(TeacherDashboardPaths.ORGANIZATION_COURSE_GENERAL_INFORMATION),
              element: <TeacherDashboardCourseLoader />,
              handle: {
                crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE],
              },
            },
            {
              path: getRoutePath(TeacherDashboardPaths.ORGANIZATION_COURSE_CONTRACTS),
              element: <TeacherDashboardCourseContractsLayout />,
              handle: {
                crumbLabel:
                  TEACHER_DASHBOARD_ROUTE_LABELS[
                    TeacherDashboardPaths.ORGANIZATION_COURSE_CONTRACTS
                  ],
              },
            },
            {
              path: getRoutePath(TeacherDashboardPaths.ORGANIZATION_PRODUCT),
              children: [
                {
                  index: true,
                  element: <TeacherDashboardTrainingLoader />,
                  handle: {
                    crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE],
                  },
                },
                {
                  path: getRoutePath(TeacherDashboardPaths.ORGANIZATION_PRODUCT_CONTRACTS),
                  element: <TeacherDashboardCourseContractsLayout />,
                  handle: {
                    crumbLabel:
                      TEACHER_DASHBOARD_ROUTE_LABELS[
                        TeacherDashboardPaths.ORGANIZATION_PRODUCT_CONTRACTS
                      ],
                  },
                },
                {
                  path: getRoutePath(
                    TeacherDashboardPaths.ORGANIZATION_COURSE_PRODUCT_LEARNER_LIST,
                  ),
                  element: <TeacherDashboardCourseLearnersLayout />,
                  handle: {
                    crumbLabel:
                      TEACHER_DASHBOARD_ROUTE_LABELS[
                        TeacherDashboardPaths.ORGANIZATION_COURSE_PRODUCT_LEARNER_LIST
                      ],
                  },
                },
              ],
            },
          ],
        },
        {
          path: getRoutePath(TeacherDashboardPaths.ORGANIZATION_CONTRACTS),
          element: <TeacherDashboardOrganizationContractsLayout />,
          handle: {
            crumbLabel:
              TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.ORGANIZATION_CONTRACTS],
          },
        },
      ],
    },
  ];

  return routes;
}
