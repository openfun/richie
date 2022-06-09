import { RouteObject } from 'react-router-dom';
import { defineMessages, MessageDescriptor } from 'react-intl';

export interface DashBoardRouteDefinition {
  element: JSX.Element;
  intlPath?: MessageDescriptor;
  intlTitle: MessageDescriptor;
  protected?: boolean;
  show?: () => boolean;
  children?: Array<DashBoardRouteDefinition>;
}

export type DashBoardRoute = RouteObject & { path: string } & (
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
});

const dashboardRoutesDefinition: Array<DashBoardRouteDefinition> = [
  {
    element: <h2>Home</h2>,
    intlPath: messages.homeDashBoardRoutePath,
    intlTitle: messages.homeDashBoardRouteTitle,
  },
  {
    element: <h2>Courses List</h2>,
    intlTitle: messages.coursesDashBoardRouteTitle,
    children: [
      {
        element: <h2>Individual Course</h2>,
        intlTitle: messages.courseDashBoardRouteTitle,
      },
    ],
  },
  {
    element: <h2>My preferences</h2>,
    intlPath: messages.preferencesDashBoardRoutePath,
    intlTitle: messages.preferencesDashBoardRouteTitle,
  },
];
export default dashboardRoutesDefinition;
