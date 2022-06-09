import { useIntl } from 'react-intl';
import { useMemo } from 'react';
import slugify from 'slugify';
import dashboardRoutesDefinition, {
  DashBoardRoute,
  DashBoardRouteDefinition,
} from 'components/DashBoard/routes';
import { useSession } from 'data/SessionProvider';
import ProtectedRoute from 'components/DashBoard/ProtectedRoute';
import Parent from '../../components/DashBoard/views/Parent';

const useDashBoardRoutes = () => {
  const intl = useIntl();

  const { user } = useSession();

  const dashboardRouteDefinitionToRoute: any = (
    routeDefinition: DashBoardRouteDefinition,
    parent?: DashBoardRouteDefinition,
  ) => ({
    ...routeDefinition,
    path: routeDefinition.path
      ? routeDefinition.path
      : routeDefinition.intlPath
      ? intl.formatMessage(routeDefinition.intlPath)
      : routeDefinition.intlTitle &&
        slugify(intl.formatMessage(routeDefinition.intlTitle), { lower: true }),
    title: routeDefinition.intlTitle && intl.formatMessage(routeDefinition.intlTitle),
    element:
      routeDefinition.protected !== false ? (
        <ProtectedRoute isAllowed={!!user} redirectPath="/">
          {parent ? routeDefinition.element : <Parent>{routeDefinition.element}</Parent>}
        </ProtectedRoute>
      ) : parent ? (
        routeDefinition.element
      ) : (
        <Parent>{routeDefinition.element}</Parent>
      ),
    children: routeDefinition.children?.map((child) =>
      dashboardRouteDefinitionToRoute(child, routeDefinition),
    ),
  });

  const routes = useMemo<Array<DashBoardRoute>>(() => {
    return dashboardRoutesDefinition.map((routeDefinition) =>
      dashboardRouteDefinitionToRoute(routeDefinition),
    );
    routes.push({
      element: <h2>404 Not Found</h2>,
      path: '*',
      show: () => false,
    });
  }, [dashboardRoutesDefinition]);

  return { routes };
};

export default useDashBoardRoutes;
