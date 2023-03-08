import { useIntl } from 'react-intl';
import { Navigate, RouteObject } from 'react-router-dom';
import { TeacherProfileSettingsDashboardLoader } from 'pages/TeacherProfileSettingsDashboardLoader';
import { TeacherUniversityCourseDashboardLoader } from 'pages/TeacherUniversityCourseDashboardLoader';
import RouteInfo from 'widgets/Dashboard/components/RouteInfo';
import { TeacherProfileDashboardLoader } from 'widgets/Dashboard/components/TeacherProfileDashboardLoader';
import NavigateWithParams from 'widgets/Dashboard/components/NavigateWithParams';
import { getDashboardRouteLabel, getDashboardRoutePath } from 'widgets/Dashboard/utils/routers';
import {
  TeacherDashboardPaths,
  teacherDashboardRouteLabels,
} from 'widgets/Dashboard/utils/teacherRouter';

export function getTeacherDashboardRoutes() {
  const intl = useIntl();
  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);
  const routes: RouteObject = {
    path: getRoutePath(TeacherDashboardPaths.ROOT),
    handle: {
      renderLayout: true,
    },
    children: [
      {
        index: true,
        element: <Navigate to={getRoutePath(TeacherDashboardPaths.TEACHER_COURSES)} replace />,
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
              crumbLabel: teacherDashboardRouteLabels[TeacherDashboardPaths.TEACHER_COURSES],
            },
            element: <TeacherProfileDashboardLoader />,
          },
          {
            path: getRoutePath(TeacherDashboardPaths.TEACHER_SETTING),
            handle: {
              crumbLabel: teacherDashboardRouteLabels[TeacherDashboardPaths.TEACHER_SETTING],
            },
            element: <TeacherProfileSettingsDashboardLoader />,
          },
          {
            path: getRoutePath(TeacherDashboardPaths.TEACHER_NOTIFICATIONS),
            handle: {
              crumbLabel: teacherDashboardRouteLabels[TeacherDashboardPaths.TEACHER_NOTIFICATIONS],
            },
            element: (
              <RouteInfo title={getRouteLabel(TeacherDashboardPaths.TEACHER_NOTIFICATIONS)} />
            ),
          },
        ],
      },
      {
        path: getRoutePath(TeacherDashboardPaths.UNIVERSITY, {
          universityId: ':universityId',
        }),
        children: [
          {
            index: true,
            element: (
              <NavigateWithParams
                to={getRoutePath(TeacherDashboardPaths.UNIVERSITY_COURSES, {
                  universityId: ':universityId',
                })}
                replace
              />
            ),
          },
          {
            path: getRoutePath(TeacherDashboardPaths.UNIVERSITY_COURSES, {
              universityId: ':universityId',
            }),
            handle: {
              crumbLabel: teacherDashboardRouteLabels[TeacherDashboardPaths.UNIVERSITY_COURSES],
            },
            element: <TeacherUniversityCourseDashboardLoader />,
          },
          {
            path: getRoutePath(TeacherDashboardPaths.UNIVERSITY_SETTINGS, {
              universityId: ':universityId',
            }),
            handle: {
              crumbLabel: teacherDashboardRouteLabels[TeacherDashboardPaths.UNIVERSITY_SETTINGS],
            },
            element: <RouteInfo title={getRouteLabel(TeacherDashboardPaths.UNIVERSITY_SETTINGS)} />,
          },
          {
            path: getRoutePath(TeacherDashboardPaths.UNIVERSITY_MEMBERS, {
              universityId: ':universityId',
            }),
            handle: {
              crumbLabel: teacherDashboardRouteLabels[TeacherDashboardPaths.UNIVERSITY_MEMBERS],
            },
            element: <RouteInfo title={getRouteLabel(TeacherDashboardPaths.UNIVERSITY_MEMBERS)} />,
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
            element: (
              <NavigateWithParams
                to={getRoutePath(TeacherDashboardPaths.COURSE_SETTINGS, {
                  courseCode: ':courseCode',
                })}
                replace
              />
            ),
          },
          {
            path: getRoutePath(TeacherDashboardPaths.COURSE_SETTINGS, {
              courseCode: ':courseCode',
            }),
            handle: {
              crumbLabel: teacherDashboardRouteLabels[TeacherDashboardPaths.COURSE_SETTINGS],
            },
            element: <RouteInfo title={getRouteLabel(TeacherDashboardPaths.COURSE_SETTINGS)} />,
          },
          {
            path: getRoutePath(TeacherDashboardPaths.COURSE_CLASSROOMS, {
              courseCode: ':courseCode',
            }),
            handle: {
              crumbLabel: teacherDashboardRouteLabels[TeacherDashboardPaths.COURSE_CLASSROOMS],
            },
            element: <RouteInfo title={getRouteLabel(TeacherDashboardPaths.COURSE_CLASSROOMS)} />,
          },
          {
            path: getRoutePath(TeacherDashboardPaths.COURSE_RECORDS_APPLICATIONS, {
              courseCode: ':courseCode',
            }),
            handle: {
              crumbLabel:
                teacherDashboardRouteLabels[TeacherDashboardPaths.COURSE_RECORDS_APPLICATIONS],
            },
            element: (
              <RouteInfo title={getRouteLabel(TeacherDashboardPaths.COURSE_RECORDS_APPLICATIONS)} />
            ),
          },
          {
            path: getRoutePath(TeacherDashboardPaths.COURSE_RECORDS_FINANCE, {
              courseCode: ':courseCode',
            }),
            handle: {
              crumbLabel: teacherDashboardRouteLabels[TeacherDashboardPaths.COURSE_RECORDS_FINANCE],
            },
            element: (
              <RouteInfo title={getRouteLabel(TeacherDashboardPaths.COURSE_RECORDS_FINANCE)} />
            ),
          },
        ],
      },
    ],
  };

  return routes;
}
