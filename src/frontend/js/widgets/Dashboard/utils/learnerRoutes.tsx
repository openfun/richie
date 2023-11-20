import { MessageDescriptor, useIntl } from 'react-intl';
import { Outlet, RouteObject } from 'react-router-dom';
import RouteInfo from 'widgets/Dashboard/components/RouteInfo';
import { DashboardCreateAddressLoader } from 'pages/DashboardAddressesManagement/DashboardCreateAddressLoader';
import { DashboardEditAddressLoader } from 'pages/DashboardAddressesManagement/DashboardEditAddressLoader';
import { DashboardPreferences } from 'pages/DashboardPreferences';
import { DashboardEditCreditCardLoader } from 'pages/DashboardCreditCardsManagement/DashboardEditCreditCardLoader';
import { DashboardCourses } from 'pages/DashboardCourses';
import { DashboardOrderLoader } from 'widgets/Dashboard/components/DashboardOrderLoader';
import {
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'widgets/Dashboard/utils/dashboardRoutes';
import {
  LEARNER_DASHBOARD_ROUTE_LABELS,
  LearnerDashboardPaths,
} from 'widgets/Dashboard/utils/learnerRouteMessages';
import { DashboardCertificates } from 'pages/DashboardCertificates';
import { DashboardOrderLayout } from 'pages/DashboardOrderLayout';
import { DashboardContracts } from 'pages/DashboardContracts';

export interface DashboardRouteHandle {
  crumbLabel?: MessageDescriptor;
  renderLayout?: boolean;
}

export function getLearnerDashboardRoutes() {
  const intl = useIntl();
  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);
  const routes: RouteObject[] = [
    {
      path: getRoutePath(LearnerDashboardPaths.COURSES),
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
          path: getRoutePath(LearnerDashboardPaths.ORDER, {
            orderId: ':orderId',
          }),
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
      path: getRoutePath(LearnerDashboardPaths.CERTIFICATES),
      handle: { crumbLabel: LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.CERTIFICATES] },
      element: <DashboardCertificates />,
    },
    {
      path: getRoutePath(LearnerDashboardPaths.CONTRACTS),
      handle: { crumbLabel: LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.CONTRACTS] },
      element: <DashboardContracts />,
    },
    {
      path: getRoutePath(LearnerDashboardPaths.COURSE, { code: ':code' }),
      element: <RouteInfo title={getRouteLabel(LearnerDashboardPaths.COURSE)} />,
      handle: { crumbLabel: LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.COURSE] },
    },
    {
      path: getRoutePath(LearnerDashboardPaths.PREFERENCES),
      handle: { crumbLabel: LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.PREFERENCES] },
      element: <Outlet />,
      children: [
        {
          index: true,
          element: <DashboardPreferences />,
        },
        {
          path: getRoutePath(LearnerDashboardPaths.PREFERENCES_ADDRESS_EDITION, {
            addressId: ':addressId',
          }),
          element: <DashboardEditAddressLoader />,
          handle: {
            crumbLabel:
              LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.PREFERENCES_ADDRESS_EDITION],
          },
        },
        {
          path: getRoutePath(LearnerDashboardPaths.PREFERENCES_ADDRESS_CREATION),
          element: <DashboardCreateAddressLoader />,
          handle: {
            crumbLabel:
              LEARNER_DASHBOARD_ROUTE_LABELS[LearnerDashboardPaths.PREFERENCES_ADDRESS_CREATION],
          },
        },
        {
          path: getRoutePath(LearnerDashboardPaths.PREFERENCES_CREDIT_CARD_EDITION, {
            creditCardId: ':creditCardId',
          }),
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
