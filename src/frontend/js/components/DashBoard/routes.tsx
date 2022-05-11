import { RouteObject } from 'react-router-dom';
import { defineMessages, MessageDescriptor } from 'react-intl';

export interface DashBoardRouteDefinition {
  element: JSX.Element;
  intlPath?: MessageDescriptor;
  intlTitle: MessageDescriptor;
  protected?: boolean;
  show?: () => boolean;
  title?: string;
}

export interface DashBoardRoute extends RouteObject {
  path: string;
  show?: () => boolean;
  title?: string;
}

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
  },
  {
    element: <h2>My preferences</h2>,
    intlPath: messages.preferencesDashBoardRoutePath,
    intlTitle: messages.preferencesDashBoardRouteTitle,
  },
];
export default dashboardRoutesDefinition;
