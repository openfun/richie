import { RouterProvider, RouterProviderProps } from 'react-router-dom';
import { useEffect } from 'react';
import { location } from 'utils/indirection/window';
import { useSession } from 'contexts/SessionContext';
import useDashboardRouter from './hooks/useDashboardRouter';

interface DashboardProps {
  router?: RouterProviderProps['router'];
}

const Dashboard = ({ router }: DashboardProps) => {
  const { user } = useSession();
  const routerToUse = router ?? useDashboardRouter();

  useEffect(() => {
    if (user === null) {
      location.replace('/');
    }
  }, [user]);

  return user ? <RouterProvider router={routerToUse} /> : null;
};

export default Dashboard;
