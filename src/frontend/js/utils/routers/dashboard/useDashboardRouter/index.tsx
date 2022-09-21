import { useMemo } from 'react';
import { createBrowserRouter, Navigate, Outlet, RouteObject } from 'react-router-dom';
import { useIntl } from 'react-intl';
import {
  DashboardPaths,
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'utils/routers/dashboard';
import useRouteInfo from 'hooks/useRouteInfo';
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

/**
 * Returns the Dashboard router.
 * As dashboard is only accessible to authenticated user, this hook
 * is also in charge to redirect user to the root of the site if user
 * is anonymous.
 */
const useDashboardRouter = () => {
  const intl = useIntl();
  const getRoutePath = getDashboardRouteLabel(intl);
  const getRouteLabel = getDashboardRoutePath(intl);

  const routes: RouteObject[] = [
    {
      path: '/',
      element: <Outlet />,
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
              element: <RouteInfo title={getRouteLabel(DashboardPaths.PREFERENCES)} />,
              handle: { crumbLabel: getRouteLabel(DashboardPaths.PREFERENCES) },
            },
            {
              path: getRoutePath(DashboardPaths.PREFERENCES_ADDRESS_EDITION, {
                addressId: ':addressId',
              }),
              element: (
                <RouteInfo title={getRouteLabel(DashboardPaths.PREFERENCES_ADDRESS_EDITION)} />
              ),
              handle: { crumbLabel: getRouteLabel(DashboardPaths.PREFERENCES_ADDRESS_EDITION) },
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

  const router = useMemo(
    () => createBrowserRouter(routes, { basename: getDashboardBasename(intl.locale) }),
    [],
  );

  return router;
};

export default useDashboardRouter;
