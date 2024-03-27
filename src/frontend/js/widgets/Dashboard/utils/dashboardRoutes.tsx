import { IntlShape, MessageDescriptor } from 'react-intl';
import type {
  FormatXMLElementFn,
  Options as IntlMessageFormatOptions,
  PrimitiveType,
} from 'intl-messageformat';
import { generatePath, Navigate, RouteObject } from 'react-router-dom';
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
  const routes: RouteObject[] = [
    {
      path: '/',
      element: <DashboardLayoutRoute />,
      children: [
        {
          index: true,
          element: <Navigate to={getDashboardRoutePath(LearnerDashboardPaths.COURSES)} replace />,
        },
        ...getLearnerDashboardRoutes(),
        {
          path: getDashboardRoutePath(TeacherDashboardPaths.ROOT),
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

const DASHBOARD_ROUTE_LABELS = {
  ...LEARNER_DASHBOARD_ROUTE_LABELS,
  ...TEACHER_DASHBOARD_ROUTE_LABELS,
};

type DashboardPath = LearnerDashboardPaths | TeacherDashboardPaths;

/** Get the provided dashboard route label in the active locale */
export const getDashboardRouteLabel =
  (intl: IntlShape) =>
  (
    path: DashboardPath,
    ...options: [
      values?: Record<string, PrimitiveType | FormatXMLElementFn<string, string>>,
      opts?: IntlMessageFormatOptions,
    ]
  ) => {
    return intl.formatMessage(DASHBOARD_ROUTE_LABELS[path], ...options);
  };

/** Get the provided dashboard route path in the active locale */
export const getDashboardRoutePath = (originalPath: string, params: any = {}) => {
  return generatePath(originalPath, params);
};
