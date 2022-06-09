import { matchPath, useLocation } from 'react-router-dom';
import { PropsWithChildren } from 'react';
import BreadCrumb from 'components/DashBoard/BreadCrumb';
import useDashboardRoutes from 'hooks/useDashboardRoutes';
import DashBoardMenu from 'components/DashBoard/menu';

const Parent = ({ children }: PropsWithChildren<{}>) => {
  const { routes } = useDashboardRoutes();
  const location = useLocation();

  const currentRoute = routes?.find((matchRoute) => {
    return matchPath(matchRoute.path, location.pathname);
  });

  if (currentRoute?.menu) {
    return (
      <>
        <BreadCrumb locationPath={location.pathname} routes={routes} />
        {currentRoute?.menu}
        <div className="dashboard_main inline-block">{children}</div>
      </>
    );
  } else {
    return (
      <>
        <BreadCrumb locationPath={location.pathname} routes={routes} />
        <DashBoardMenu />
        <div className="dashboard_main inline-block">{children}</div>
      </>
    );
  }
};

export default Parent;
