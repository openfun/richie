import { IntlShape, MessageDescriptor, useIntl } from 'react-intl';
import type {
  FormatXMLElementFn,
  Options as IntlMessageFormatOptions,
  PrimitiveType,
} from 'intl-messageformat';
import { Navigate, RouteObject } from 'react-router-dom';
import { DashboardLayoutRoute } from 'widgets/Dashboard/components/DashboardLayoutRoute';
import {
  LearnerDashboardPaths,
  LEARNER_DASHBOARD_ROUTE_LABELS,
  LEARNER_DASHBOARD_ROUTE_PATHS,
} from 'widgets/Dashboard/utils/learnerRouteMessages';
import { getLearnerDashboardRoutes } from 'widgets/Dashboard/utils/learnerRoutes';
import { getTeacherDashboardRoutes } from 'widgets/Dashboard/utils/teacherRoutes';
import {
  TeacherDashboardPaths,
  TEACHER_DASHBOARD_ROUTE_LABELS,
  TEACHER_DASHBOARD_ROUTE_PATHS,
} from './teacherRouteMessages';

export interface DashboardRouteHandle {
  crumbLabel?: MessageDescriptor;
  renderLayout?: boolean;
}

export function getDashboardRoutes() {
  const intl = useIntl();
  const getRoutePath = getDashboardRoutePath(intl);
  const routes: RouteObject[] = [
    {
      path: '/',
      element: <DashboardLayoutRoute />,
      children: [
        {
          index: true,
          element: <Navigate to={getRoutePath(LearnerDashboardPaths.COURSES)} replace />,
        },
        ...getLearnerDashboardRoutes(),
        {
          path: getRoutePath(TeacherDashboardPaths.ROOT),
          handle: {
            renderLayout: true,
            crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.TEACHER_COURSES],
          },
          children: getTeacherDashboardRoutes(),
        },
      ],
    },
  ];
  return routes;
}

/**
 * Use `intl.formatMessage` to retrieve a path or label of a given route for the active locale.
 *
 * Currying function which takes first the type of attribute to translate (path or label)
 * then takes the intl object retrieved from the IntlProvider.
 * Finally, it takes a path and options to pass to `intl.formatMessage` method
 */

enum RouteAttributes {
  PATH = 'path',
  LABEL = 'label',
}

const DASHBOARD_ROUTE_LABELS = {
  ...LEARNER_DASHBOARD_ROUTE_LABELS,
  ...TEACHER_DASHBOARD_ROUTE_LABELS,
};
const DASHBOARD_ROUTE_PATHS = {
  ...LEARNER_DASHBOARD_ROUTE_PATHS,
  ...TEACHER_DASHBOARD_ROUTE_PATHS,
};
type DashboardPath = LearnerDashboardPaths | TeacherDashboardPaths;

const getDashboardRouteAttribute =
  (attribute: RouteAttributes) =>
  (intl: IntlShape) =>
  (
    path: DashboardPath,
    ...options: [
      values?: Record<string, PrimitiveType | FormatXMLElementFn<string, string>>,
      opts?: IntlMessageFormatOptions,
    ]
  ) => {
    const isLabel = attribute === RouteAttributes.LABEL;

    const message = isLabel ? DASHBOARD_ROUTE_LABELS[path] : DASHBOARD_ROUTE_PATHS[path];
    return intl.formatMessage(message, ...options);
  };

/** Get the provided dashboard route label in the active locale */
export const getDashboardRouteLabel = getDashboardRouteAttribute(RouteAttributes.LABEL);

/** Get the provided dashboard route path in the active locale */
export const getDashboardRoutePath = getDashboardRouteAttribute(RouteAttributes.PATH);
