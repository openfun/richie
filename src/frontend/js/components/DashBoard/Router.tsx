import { useRoutes } from 'react-router-dom';
import { DashBoardRoute } from './routes';

interface DashBoardRouterProps {
  routes: DashBoardRoute[];
}

const DashBoardRouter = ({ routes }: DashBoardRouterProps) => {
  const routesNode = useRoutes(routes);

  if (!routes) {
    throw new Error('dashboardRoutes has not been found !');
  }

  return <div>{routesNode}</div>;
};

export default DashBoardRouter;
