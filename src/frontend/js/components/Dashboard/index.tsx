import { RouterProvider, RouterProviderProps } from 'react-router-dom';
import { useEffect } from 'react';
import useDashboardRouter from 'utils/routers/dashboard/useDashboardRouter';
import { location } from 'utils/indirection/window';
import { useSession } from 'data/SessionProvider';

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
