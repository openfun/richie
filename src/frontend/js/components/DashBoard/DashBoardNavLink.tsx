import { NavLink, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { DashBoardRoute } from './routes';

interface DashBoardNavLinkProps {
  route: DashBoardRoute;
  parents: DashBoardRoute[];
}

const DashBoardNavLink = ({ route, parents }: DashBoardNavLinkProps) => {
  const params = useParams();

  const path = useMemo(() => {
    let rawPath = [...parents, route].map((r) => r.path).join('/');

    Object.entries(params).forEach((param, value) => {
      rawPath = rawPath.replaceAll(`:${param}`, `${value}`);
    });

    return `/${rawPath}`;
  }, [route, parents, params]);

  return (
    <NavLink
      to={path}
      key={`nav_${
        (parents.length > 0 ? parents.map((r) => r.path).join('_') + '_' : '') + route.path
      }`}
    >
      {route.title}
    </NavLink>
  );
};

export default DashBoardNavLink;
