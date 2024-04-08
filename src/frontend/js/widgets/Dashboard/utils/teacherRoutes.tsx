import { Navigate, RouteObject } from 'react-router-dom';
import {
  TeacherDashboardCourseContractsLayout,
  TeacherDashboardOrganizationContractsLayout,
} from 'pages/TeacherDashboardContractsLayout';
import { TeacherDashboardOrganizationCourseLoader } from 'pages/TeacherDashboardOrganizationCourseLoader';
import { TeacherDashboardCoursesLoader } from 'pages/TeacherDashboardCoursesLoader';
import NavigateWithParams from 'widgets/Dashboard/components/NavigateWithParams';
import { TeacherDashboardCourseLoader } from 'pages/TeacherDashboardCourseLoader';
import { TeacherDashboardTrainingLoader } from 'pages/TeacherDashboardTraining';
import { TeacherDashboardCourseLearnersLayout } from 'pages/TeacherDashboardCourseLearnersLayout';
import {
  TEACHER_DASHBOARD_ROUTE_LABELS,
  TeacherDashboardPaths,
} from 'widgets/Dashboard/utils/teacherDashboardPaths';

export function getTeacherDashboardRoutes() {
  const routes: RouteObject[] = [
    {
      index: true,
      element: <Navigate to={TeacherDashboardPaths.TEACHER_COURSES} replace />,
    },
    {
      path: TeacherDashboardPaths.TEACHER_COURSES,
      children: [
        {
          index: true,
          element: <TeacherDashboardCoursesLoader />,
        },
        {
          path: TeacherDashboardPaths.COURSE,
          children: [
            {
              index: true,
              element: (
                <NavigateWithParams to={TeacherDashboardPaths.COURSE_GENERAL_INFORMATION} replace />
              ),
            },
            {
              path: TeacherDashboardPaths.COURSE_GENERAL_INFORMATION,
              element: <TeacherDashboardCourseLoader />,
              handle: {
                crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE],
              },
            },
            {
              path: TeacherDashboardPaths.COURSE_PRODUCT,
              children: [
                {
                  index: true,
                  element: <TeacherDashboardTrainingLoader />,
                  handle: {
                    crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE],
                  },
                },
                {
                  path: TeacherDashboardPaths.COURSE_PRODUCT_CONTRACTS,
                  element: <TeacherDashboardCourseContractsLayout />,
                  handle: {
                    crumbLabel:
                      TEACHER_DASHBOARD_ROUTE_LABELS[
                        TeacherDashboardPaths.COURSE_PRODUCT_CONTRACTS
                      ],
                  },
                },
                {
                  path: TeacherDashboardPaths.COURSE_PRODUCT_LEARNER_LIST,
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
          ],
        },
      ],
    },
    {
      path: TeacherDashboardPaths.ORGANIZATION,
      handle: {
        crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.ORGANIZATION],
      },
      children: [
        {
          index: true,
          element: <NavigateWithParams to={TeacherDashboardPaths.ORGANIZATION_COURSES} replace />,
        },
        {
          path: TeacherDashboardPaths.ORGANIZATION_COURSES,
          children: [
            {
              index: true,
              element: <TeacherDashboardOrganizationCourseLoader />,
            },
            {
              path: TeacherDashboardPaths.ORGANIZATION_COURSE_GENERAL_INFORMATION,
              element: <TeacherDashboardCourseLoader />,
              handle: {
                crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE],
              },
            },
            {
              path: TeacherDashboardPaths.ORGANIZATION_COURSE_CONTRACTS,
              element: <TeacherDashboardCourseContractsLayout />,
              handle: {
                crumbLabel:
                  TEACHER_DASHBOARD_ROUTE_LABELS[
                    TeacherDashboardPaths.ORGANIZATION_COURSE_CONTRACTS
                  ],
              },
            },
            {
              path: TeacherDashboardPaths.ORGANIZATION_PRODUCT,
              children: [
                {
                  index: true,
                  element: <TeacherDashboardTrainingLoader />,
                  handle: {
                    crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.COURSE],
                  },
                },
                {
                  path: TeacherDashboardPaths.ORGANIZATION_PRODUCT_CONTRACTS,
                  element: <TeacherDashboardCourseContractsLayout />,
                  handle: {
                    crumbLabel:
                      TEACHER_DASHBOARD_ROUTE_LABELS[
                        TeacherDashboardPaths.ORGANIZATION_PRODUCT_CONTRACTS
                      ],
                  },
                },
                {
                  path: TeacherDashboardPaths.ORGANIZATION_COURSE_PRODUCT_LEARNER_LIST,
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
          path: TeacherDashboardPaths.ORGANIZATION_CONTRACTS,
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
