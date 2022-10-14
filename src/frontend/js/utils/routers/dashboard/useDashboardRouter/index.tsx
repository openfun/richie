import type {
  FormatXMLElementFn,
  Options as IntlMessageFormatOptions,
  PrimitiveType,
} from 'intl-messageformat';
import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import {
  createBrowserRouter,
  Navigate,
  NavigateOptions,
  Outlet,
  RouteObject,
  useNavigate,
} from 'react-router-dom';
import { DashboardCreateAddressLoader } from 'components/DashboardAddressesManagement/DashboardCreateAddressLoader';
import { DashboardEditAddressLoader } from 'components/DashboardAddressesManagement/DashboardEditAddressLoader';
import { DashboardPreferences } from 'components/DashboardPreferences';
import useRouteInfo from 'hooks/useRouteInfo';
import {
  DashboardPaths,
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'utils/routers/dashboard';
import { DashboardLayout } from 'components/Dashboard/DashboardLayout';
import { getDashboardBasename } from './getDashboardBasename';

/**
 * *Temporary
 *
 * A dummy route component for example which displays
 * all data related to the current route
 */
const RouteInfo = ({ title }: { title: string }) => {
  const routeInfo = useRouteInfo();

  return (
    <div data-testid={`RouteInfo-${routeInfo.pathname}`}>
      <h1>{title}</h1>
      <dl>
        <dt>Route information :</dt>
        <dd>
          <pre>{JSON.stringify(routeInfo, null, 2)}</pre>
        </dd>
      </dl>
    </div>
  );
};

export function getDashboardRoutes() {
  const intl = useIntl();
  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);

  const routes: RouteObject[] = [
    {
      path: '/',
      element: <DashboardLayout />,
      children: [
        {
          index: true,
          element: <Navigate to={getRoutePath(DashboardPaths.COURSES)} replace />,
        },
        {
          path: getRoutePath(DashboardPaths.COURSES),
          element: <RouteInfo title={getRouteLabel(DashboardPaths.COURSES)} />,
          handle: { crumbLabel: getRouteLabel(DashboardPaths.COURSES) },
        },
        {
          path: getRoutePath(DashboardPaths.COURSE, { code: ':code' }),
          element: <RouteInfo title={getRouteLabel(DashboardPaths.COURSE)} />,
          handle: { crumbLabel: getRouteLabel(DashboardPaths.COURSE) },
        },
        {
          path: getRoutePath(DashboardPaths.PREFERENCES),
          handle: { name: getRouteLabel(DashboardPaths.PREFERENCES) },
          element: <Outlet />,
          children: [
            {
              index: true,
              element: <DashboardPreferences />,
              handle: { crumbLabel: getRouteLabel(DashboardPaths.PREFERENCES) },
            },
            {
              path: getRoutePath(DashboardPaths.PREFERENCES_ADDRESS_EDITION, {
                addressId: ':addressId',
              }),
              element: <DashboardEditAddressLoader />,
              handle: { crumbLabel: getRouteLabel(DashboardPaths.PREFERENCES_ADDRESS_EDITION) },
            },
            {
              path: getRoutePath(DashboardPaths.PREFERENCES_ADDRESS_CREATION),
              element: <DashboardCreateAddressLoader />,
              handle: { crumbLabel: getRouteLabel(DashboardPaths.PREFERENCES_ADDRESS_CREATION) },
            },
            {
              path: getRoutePath(DashboardPaths.PREFERENCES_CREDIT_CARD_EDITION, {
                creditCardId: ':creditCardId',
              }),
              element: (
                <RouteInfo title={getRouteLabel(DashboardPaths.PREFERENCES_CREDIT_CARD_EDITION)} />
              ),
              handle: { crumbLabel: getRouteLabel(DashboardPaths.PREFERENCES_CREDIT_CARD_EDITION) },
            },
          ],
        },
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
