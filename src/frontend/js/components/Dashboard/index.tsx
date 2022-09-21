import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';
import useDashboardRouter from 'utils/routers/dashboard/useDashboardRouter';
import { location } from 'utils/indirection/window';
import { useSession } from 'data/SessionProvider';

const Dashboard = () => {
  const { user } = useSession();
  const router = useDashboardRouter();

  useEffect(() => {
    if (!user) {
      location.replace('/');
    }
  }, [user]);

  return user ? <RouterProvider router={router} /> : null;
};

export default Dashboard;
