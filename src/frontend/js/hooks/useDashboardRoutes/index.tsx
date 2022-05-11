import { useIntl } from 'react-intl';
import { useMemo } from 'react';
import slugify from 'slugify';
import dashboardRoutesDefinition, { DashBoardRoute } from 'components/DashBoard/routes';
import { useSession } from 'data/SessionProvider';
import ProtectedRoute from 'components/DashBoard/ProtectedRoute';

const useDashBoardRoutes = () => {
  const intl = useIntl();

  const { user } = useSession();

  const routes = useMemo<Array<DashBoardRoute>>(() => {
    return dashboardRoutesDefinition.map((routeDefinition) => ({
      ...routeDefinition,
      path: routeDefinition.intlPath
        ? intl.formatMessage(routeDefinition.intlPath)
        : slugify(intl.formatMessage(routeDefinition.intlTitle), { lower: true }),
      title: intl.formatMessage(routeDefinition.intlTitle),
      element:
        routeDefinition.protected !== false ? (
          <ProtectedRoute isAllowed={!!user} redirectPath="/">
            {routeDefinition.element}
          </ProtectedRoute>
        ) : (
          routeDefinition.element
        ),
    }));
  }, [user]);

  routes.push({
    element: <h2>404 Not Found</h2>,
    path: '*',
  });
  return { routes };
};

export default useDashBoardRoutes;
