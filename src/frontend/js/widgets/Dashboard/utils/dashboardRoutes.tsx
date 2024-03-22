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
} from 'widgets/Dashboard/utils/learnerRouteMessages';
import { getLearnerDashboardRoutes } from 'widgets/Dashboard/utils/learnerRoutes';
import { getTeacherDashboardRoutes } from 'widgets/Dashboard/utils/teacherRoutes';
import { TeacherDashboardPaths, TEACHER_DASHBOARD_ROUTE_LABELS } from './teacherRouteMessages';

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

    if (isLabel) {
      return intl.formatMessage(DASHBOARD_ROUTE_LABELS[path], ...options);
    }

    let outputPath = path as string;
    options.forEach((option) => {
      if (!option) {
        return;
      }
      Object.entries(option).forEach(([key, value]) => {
        outputPath = outputPath.replace(`:${key}`, value as string);
      });
    });

    return outputPath;
  };

/** Get the provided dashboard route label in the active locale */
export const getDashboardRouteLabel = getDashboardRouteAttribute(RouteAttributes.LABEL);

/** Get the provided dashboard route path in the active locale */
export const getDashboardRoutePath = getDashboardRouteAttribute(RouteAttributes.PATH);
