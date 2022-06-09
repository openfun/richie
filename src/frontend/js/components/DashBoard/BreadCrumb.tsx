import { Link, matchRoutes } from 'react-router-dom';
import { DashBoardRoute } from './routes';

interface BreadCrumbPropType {
  locationPath: string;
  routes: DashBoardRoute[];
}
const Breadcrumb = ({ locationPath, routes }: BreadCrumbPropType) => {
  const matchedRoutes = matchRoutes(routes, locationPath);

  return (
    <nav>
      <ol className="breadcrumb">
        {matchedRoutes?.map((matchRoute, i) => {
          const { path } = matchRoute.route as DashBoardRoute;
          const isActive = path === locationPath;

          return isActive ? (
            <li key={i} className="breadcrumb-item active">
              {path}
            </li>
          ) : (
            <li key={i} className="breadcrumb-item">
              <Link to={path}>{path} </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
