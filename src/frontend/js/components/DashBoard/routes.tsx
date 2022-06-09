import { Outlet, RouteObject } from 'react-router-dom';
import { defineMessages, MessageDescriptor } from 'react-intl';
import Course from './views/Course';
import DashBoardMenu from './menu';

export interface DashBoardRouteDefinition {
  element: JSX.Element;
  path?: string;
  intlPath?: MessageDescriptor;
  intlTitle?: MessageDescriptor;
  protected?: boolean;
  show?: () => boolean;
  menu?: JSX.Element;
  children?: Array<DashBoardRouteDefinition>;
  tags?: Array<string>;
}

export type DashBoardRoute = Omit<RouteObject, 'children'> & {
  path: string;
  tags?: Array<string>;
  children?: Array<DashBoardRoute>;
  menu?: JSX.Element;
} & (
    | {
        show?: () => boolean;
        title: string;
      }
    | {
        show: () => false;
        title?: string;
      }
  );

export const messages = defineMessages({
  homeDashBoardRouteTitle: {
    id: 'components.Dashboard.routes.home.title',
    defaultMessage: 'Dashboard',
    description: "title of the dashboard's home view",
  },
  homeDashBoardRoutePath: {
    id: 'components.Dashboard.routes.home.path',
    defaultMessage: '/',
    description: "path of the dashboard's home view",
  },
  coursesDashBoardRouteTitle: {
    id: 'components.Dashboard.routes.courses.title',
    defaultMessage: 'Courses',
    description: "title of the dashboard's courses view",
  },
  courseDashBoardRouteTitle: {
    id: 'components.Dashboard.routes.course.title',
    defaultMessage: 'Course',
    description: "title of the dashboard's course view",
  },
  courseIndexDashBoardRouteTitle: {
    id: 'components.Dashboard.routes.course.index.title',
    defaultMessage: 'courses',
    description: "title of the dashboard's course view",
  },
  courseDashBoardRoutePath: {
    id: 'components.Dashboard.routes.course.path',
    defaultMessage: 'course/:courseId',
    description: "path of the dashboard's course view",
  },
  preferencesDashBoardRouteTitle: {
    id: 'components.Dashboard.routes.preferences.title',
    defaultMessage: 'My preferences',
    description: "title of the dashboard's preferences view",
  },
  preferencesDashBoardRoutePath: {
    id: 'components.Dashboard.routes.preferences.path',
    defaultMessage: 'preferences',
    description: "path of the dashboard's preferences view",
  },
  courseStatsTitle: {
    id: 'components.Dashboard.routes.course.stats.title',
    defaultMessage: 'Statistics',
    description: "title of the dashboard's course statistic view",
  },
  courseStatsPath: {
    id: 'components.Dashboard.routes.course.stats.path',
    defaultMessage: 'course/:courseId/stats',
    description: "path of the dashboard's course statistic view",
  },
});

const isCoursePath = () => {
  // @TODO How manage internationalized path
  return new RegExp(`${'course/:courseId'.replace(':courseId', '.*')}`).test(
    window.location.pathname,
  );
};

const dashboardRoutesDefinition: Array<DashBoardRouteDefinition> = [
  {
    element: <h2>Home</h2>,
    intlPath: messages.homeDashBoardRoutePath,
    intlTitle: messages.homeDashBoardRouteTitle,
    show: () => !isCoursePath(),
    tags: ['main'],
  },
  {
    element: <Outlet />,
    intlTitle: messages.courseIndexDashBoardRouteTitle,
    children: [
      {
        path: '/courses',
        element: <h2>Course List</h2>,
        menu: <DashBoardMenu tags={['courses']} />,
      },
      {
        element: <Course />,
        intlPath: messages.courseDashBoardRoutePath,
        intlTitle: messages.courseDashBoardRouteTitle,
        show: isCoursePath,
        menu: <DashBoardMenu tags={['courses']} />,
      },
    ],
    tags: ['main', 'courses'],
  },
  {
    element: <h2>My preferences</h2>,
    intlPath: messages.preferencesDashBoardRoutePath,
    intlTitle: messages.preferencesDashBoardRouteTitle,
    show: () => !isCoursePath(),
    tags: ['main', 'courses'],
  },
  {
    element: <h2>Statistics</h2>,
    intlTitle: messages.courseStatsTitle,
    intlPath: messages.courseStatsPath,
    show: isCoursePath,
    tags: ['courses'],
  },
];
export default dashboardRoutesDefinition;
