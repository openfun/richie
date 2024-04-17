import { IntlShape, MessageDescriptor } from 'react-intl';
import type {
  FormatXMLElementFn,
  Options as IntlMessageFormatOptions,
  PrimitiveType,
} from 'intl-messageformat';
import { generatePath, Navigate, RouteObject } from 'react-router-dom';
import DashboardPageNotFound from 'pages/DashboardPageNotFound';
import { DashboardLayoutRoute } from 'widgets/Dashboard/components/DashboardLayoutRoute';
import { getLearnerDashboardRoutes } from 'widgets/Dashboard/utils/learnerRoutes';
import { getTeacherDashboardRoutes } from 'widgets/Dashboard/utils/teacherRoutes';
import {
  TEACHER_DASHBOARD_ROUTE_LABELS,
  TeacherDashboardPaths,
} from 'widgets/Dashboard/utils/teacherDashboardPaths';
import {
  LEARNER_DASHBOARD_ROUTE_LABELS,
  LearnerDashboardPaths,
} from 'widgets/Dashboard/utils/learnerRoutesPaths';
import ProtectedRoute from 'components/ProtectedRoute';
import { useJoanieUserAbilities } from 'hooks/useJoanieUserAbilities';
import { abilityActions } from 'utils/AbilitiesHelper';

export interface DashboardRouteHandle {
  crumbLabel?: MessageDescriptor;
  renderLayout?: boolean;
}

export function getDashboardRoutes() {
  const joanieUserAbilities = useJoanieUserAbilities();

  const routes: RouteObject[] = [
    {
      path: '/',
      element: <DashboardLayoutRoute />,
      children: [
        {
          path: '*',
          element: <DashboardPageNotFound />,
          handle: {
            renderLayout: true,
          },
        },
        {
          index: true,
          element: <Navigate to={generatePath(LearnerDashboardPaths.COURSES)} replace />,
        },
        ...getLearnerDashboardRoutes(),
      ],
    },
  ];

  if (joanieUserAbilities === undefined) {
    return routes;
  }

  routes.push({
    element: (
      <ProtectedRoute
        isAllowed={joanieUserAbilities?.can(abilityActions.ACCESS_TEACHER_DASHBOARD)}
        redirectPath="/"
      />
    ),
    children: [
      {
        path: generatePath(TeacherDashboardPaths.ROOT),
        handle: {
          renderLayout: true,
          crumbLabel: TEACHER_DASHBOARD_ROUTE_LABELS[TeacherDashboardPaths.TEACHER_COURSES],
        },
        children: getTeacherDashboardRoutes(),
      },
    ],
  });

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
