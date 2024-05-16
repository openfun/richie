import { MessageDescriptor, useIntl } from 'react-intl';
import { Navigate, Outlet, RouteObject } from 'react-router-dom';
import RouteInfo from 'widgets/Dashboard/components/RouteInfo';
import { DashboardCreateAddressLoader } from 'pages/DashboardAddressesManagement/DashboardCreateAddressLoader';
import { DashboardEditAddressLoader } from 'pages/DashboardAddressesManagement/DashboardEditAddressLoader';
import { DashboardPreferences } from 'pages/DashboardPreferences';
import { DashboardEditCreditCardLoader } from 'pages/DashboardCreditCardsManagement/DashboardEditCreditCardLoader';
import { DashboardCourses } from 'pages/DashboardCourses';
import { DashboardOrderLoader } from 'widgets/Dashboard/components/DashboardOrderLoader';
import { getDashboardRouteLabel } from 'widgets/Dashboard/utils/dashboardRoutes';
import { DashboardCertificates } from 'pages/DashboardCertificates';
import { DashboardOrderLayout } from 'pages/DashboardOrderLayout';
import { DashboardContracts } from 'pages/DashboardContracts';
import {
  LEARNER_DASHBOARD_ROUTE_LABELS,
  LearnerDashboardPaths,
} from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { CertificateType } from 'types/Joanie';

export interface DashboardRouteHandle {
  crumbLabel?: MessageDescriptor;
  renderLayout?: boolean;
}

export function getLearnerDashboardRoutes() {
  const intl = useIntl();
  const getRouteLabel = getDashboardRouteLabel(intl);
  const routes: RouteObject[] = [
    {
      path: LearnerDashboardPaths.COURSES,
      handle: {
        crumbLabel: LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.COURSES],
      },
      element: <Outlet />,
      children: [
        {
          index: true,
          element: <DashboardCourses />,
        },
        {
          path: LearnerDashboardPaths.ORDER,
          element: <DashboardOrderLayout />,
          handle: {
            renderLayout: true,
            crumbLabel: LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.ORDER],
          },
          children: [
            {
              index: true,
              element: <DashboardOrderLoader />,
            },
          ],
        },
      ],
    },
    {
      path: LearnerDashboardPaths.CERTIFICATES,
      children: [
        {
          index: true,
          element: <Navigate to={LearnerDashboardPaths.ORDER_CERTIFICATES} replace />,
        },
        {
          path: LearnerDashboardPaths.ORDER_CERTIFICATES,
          handle: {
            crumbLabel: LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.ORDER_CERTIFICATES],
          },
          element: <DashboardCertificates certificateType={CertificateType.ORDER} />,
        },
        {
          path: LearnerDashboardPaths.ENROLLMENT_CERTIFICATES,
          handle: {
            crumbLabel: LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.ORDER_CERTIFICATES],
          },
          element: <DashboardCertificates certificateType={CertificateType.ENROLLMENT} />,
        },
      ],
    },
    {
      path: LearnerDashboardPaths.CONTRACTS,
      handle: { crumbLabel: LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.CONTRACTS] },
      element: <DashboardContracts />,
    },
    {
      path: LearnerDashboardPaths.COURSE,
      element: <RouteInfo title={getRouteLabel(LearnerDashboardPaths.COURSE)} />,
      handle: { crumbLabel: LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.COURSE] },
    },
    {
      path: LearnerDashboardPaths.PREFERENCES,
      handle: { crumbLabel: LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.PREFERENCES] },
      element: <Outlet />,
      children: [
        {
          index: true,
          element: <DashboardPreferences />,
        },
        {
          path: LearnerDashboardPaths.PREFERENCES_ADDRESS_EDITION,
          element: <DashboardEditAddressLoader />,
          handle: {
            crumbLabel:
              LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.PREFERENCES_ADDRESS_EDITION],
          },
        },
        {
          path: LearnerDashboardPaths.PREFERENCES_ADDRESS_CREATION,
          element: <DashboardCreateAddressLoader />,
          handle: {
            crumbLabel:
              LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.PREFERENCES_ADDRESS_CREATION],
          },
        },
        {
          path: LearnerDashboardPaths.PREFERENCES_CREDIT_CARD_EDITION,
          element: <DashboardEditCreditCardLoader />,
          handle: {
            crumbLabel:
              LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.PREFERENCES_CREDIT_CARD_EDITION],
          },
        },
      ],
    },
  ];

  return routes;
}
