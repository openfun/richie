import { Outlet, useLocation } from 'react-router-dom';
import { DashboardBreadcrumbsProvider } from 'widgets/Dashboard/contexts/DashboardBreadcrumbsContext';
import { DashboardBreadcrumbs } from '../DashboardBreadcrumbs';
import { DashboardSidebar } from '../DashboardSidebar';

export const DashboardLayout = () => {
  const location = useLocation();
  return (
    <DashboardBreadcrumbsProvider>
      <div className="dashboard">
        <DashboardSidebar />
        <div className="dashboard__content">
          <header>
            <DashboardBreadcrumbs />
          </header>
          <main data-testid={`location-display-${location.pathname}`}>
            <Outlet />
          </main>
        </div>
      </div>
    </DashboardBreadcrumbsProvider>
  );
};
