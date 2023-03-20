import { createMemoryRouter } from 'react-router-dom';
import Dashboard from 'widgets/Dashboard';
import { getDashboardRoutes } from 'widgets/Dashboard/utils/dashboardRoutes';

interface DashboardTestProps {
  initialRoute?: string;
}

/**
 * We must use a memory router in order to test navigation with react-router v6.
 */
export const DashboardTest = ({ initialRoute }: DashboardTestProps) => {
  const router = createMemoryRouter(getDashboardRoutes(), {
    initialEntries: initialRoute ? [initialRoute] : undefined,
  });
  return <Dashboard router={router} />;
};
