import type {
  FormatXMLElementFn,
  Options as IntlMessageFormatOptions,
  PrimitiveType,
} from 'intl-messageformat';
import { useMemo } from 'react';
import { MessageDescriptor, useIntl } from 'react-intl';
import {
  createBrowserRouter,
  Navigate,
  NavigateOptions,
  Outlet,
  RouteObject,
  useNavigate,
} from 'react-router-dom';
import { DashboardLayoutRoute } from 'widgets/Dashboard/components/DashboardLayoutRoute';
import RouteInfo from 'widgets/Dashboard/components/RouteInfo';
import { DashboardCreateAddressLoader } from 'pages/DashboardAddressesManagement/DashboardCreateAddressLoader';
import { DashboardEditAddressLoader } from 'pages/DashboardAddressesManagement/DashboardEditAddressLoader';
import { DashboardPreferences } from 'pages/DashboardPreferences';
import { DashboardEditCreditCardLoader } from 'pages/DashboardCreditCardsManagement/DashboardEditCreditCardLoader';
import { DashboardCourses } from 'pages/DashboardCourses';
import { getTeacherDashboardRoutes } from 'widgets/Dashboard/hooks/useTeacherDashboardRouter';
import { DashboardOrderLoader } from 'widgets/Dashboard/components/DashboardOrderLoader';
import {
  DashboardPaths,
  dashboardRouteLabels,
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'widgets/Dashboard/utils/routers';
import { getDashboardBasename } from './getDashboardBasename';

export interface DashboardRouteHandle {
  crumbLabel?: MessageDescriptor;
  renderLayout?: boolean;
}

export function getDashboardRoutes() {
  const intl = useIntl();
  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);
  const routes: RouteObject[] = [
    {
      path: '/',
      element: <DashboardLayoutRoute />,
      children: [
        {
          index: true,
          element: <Navigate to={getRoutePath(DashboardPaths.COURSES)} replace />,
        },
        {
          path: getRoutePath(DashboardPaths.COURSES),
          handle: { crumbLabel: dashboardRouteLabels[DashboardPaths.COURSES] },
          element: <Outlet />,
          children: [
            {
              index: true,
              element: <DashboardCourses />,
            },
            {
              path: getRoutePath(DashboardPaths.ORDER, {
                orderId: ':orderId',
              }),
              element: <DashboardOrderLoader />,
              handle: { crumbLabel: dashboardRouteLabels[DashboardPaths.ORDER] },
            },
          ],
        },
        {
          path: getRoutePath(DashboardPaths.COURSE, { code: ':code' }),
          element: <RouteInfo title={getRouteLabel(DashboardPaths.COURSE)} />,
          handle: { crumbLabel: dashboardRouteLabels[DashboardPaths.COURSE] },
        },
        {
          path: getRoutePath(DashboardPaths.PREFERENCES),
          handle: { crumbLabel: dashboardRouteLabels[DashboardPaths.PREFERENCES] },
          element: <Outlet />,
          children: [
            {
              index: true,
              element: <DashboardPreferences />,
            },
            {
              path: getRoutePath(DashboardPaths.PREFERENCES_ADDRESS_EDITION, {
                addressId: ':addressId',
              }),
              element: <DashboardEditAddressLoader />,
              handle: {
                crumbLabel: dashboardRouteLabels[DashboardPaths.PREFERENCES_ADDRESS_EDITION],
              },
            },
            {
              path: getRoutePath(DashboardPaths.PREFERENCES_ADDRESS_CREATION),
              element: <DashboardCreateAddressLoader />,
              handle: {
                crumbLabel: dashboardRouteLabels[DashboardPaths.PREFERENCES_ADDRESS_CREATION],
              },
            },
            {
              path: getRoutePath(DashboardPaths.PREFERENCES_CREDIT_CARD_EDITION, {
                creditCardId: ':creditCardId',
              }),
              element: <DashboardEditCreditCardLoader />,
              handle: {
                crumbLabel: dashboardRouteLabels[DashboardPaths.PREFERENCES_CREDIT_CARD_EDITION],
              },
            },
          ],
        },
        getTeacherDashboardRoutes(),
      ],
    },
  ];
  return routes;
}

/**
 * Returns the Dashboard router.
 * As dashboard is only accessible to authenticated user, this hook
 * is also in charge to redirect user to the root of the site if user
 * is anonymous.
 */
const useDashboardRouter = () => {
  const intl = useIntl();
  return createBrowserRouter(getDashboardRoutes(), { basename: getDashboardBasename(intl.locale) });
};

/**
 * Wrapper for `useNavigate` to avoid repetitive hooks calls.
 */
export const useDashboardNavigate = () => {
  const getRoutePath = getDashboardRoutePath(useIntl());
  const navigate = useNavigate();
  return useMemo(
    () =>
      (
        to: number | DashboardPaths,
        values?: Record<string, PrimitiveType | FormatXMLElementFn<string, string>>,
        options?: IntlMessageFormatOptions,
        routerOptions?: NavigateOptions,
      ) => {
        if (typeof to === 'number') {
          return navigate(to);
        }
        return navigate(getRoutePath(to, values, options), routerOptions);
      },
    [],
  );
};

export default useDashboardRouter;
