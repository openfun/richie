import { NavLink, useRoutes } from 'react-router-dom';
import { ReactNode } from 'react';
import { DashBoardRoute } from './routes';

interface DashBoardRouterProps {
  routes: DashBoardRoute[];
}

const DashBoardRouter = ({ routes }: DashBoardRouterProps) => {
  const routesNode = useRoutes(routes);

  if (!routes) {
    throw new Error('dashboardRoutes has not been found !');
  }

  return (
    <>
      <nav className="dashboard_nav inline-block">
        {routes.reduce((links, route) => {
          if (
            route.path && route.title && typeof route.show === 'function' ? route.show?.() : true
          ) {
            links.push(
              <NavLink to={route.path} key={`nav_${route.path}`}>
                {route.title}
              </NavLink>,
            );
          }
          return links;
        }, [] as ReactNode[])}
      </nav>
      <div className="dashboard_main inline-block">{routesNode}</div>
    </>
  );
};

export default DashBoardRouter;
