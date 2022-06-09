import DashBoardNavLink from 'components/DashBoard/DashBoardNavLink';
import { DashBoardRoute } from '../routes';
import useDashboardRoutes from '../../../hooks/useDashboardRoutes';

interface DashBoardMenuPropType {
  tags?: string[];
}

const DashBoardMenu = ({ tags = ['main'] }: DashBoardMenuPropType) => {
  const { routes } = useDashboardRoutes();
  const getNav = (route: DashBoardRoute, parents: DashBoardRoute[] = []) => {
    if (route.path && route.title && (route.show ? route.show() : true)) {
      return (
        <li key={`li_${route.path}`}>
          <DashBoardNavLink route={route} parents={parents} />
          {route.children && route.children.length > 0 && (
            <ul>{route.children.map((child) => getNav(child, [...parents, route]))}</ul>
          )}
        </li>
      );
    }
  };
  return (
    <nav className="dashboard_nav inline-block">
      <ul>
        {routes
          .filter((route) => {
            return route?.tags?.filter((tag) => tags.indexOf(tag));
          })
          .map((route) => getNav(route))}
      </ul>
    </nav>
  );
};

export default DashBoardMenu;
