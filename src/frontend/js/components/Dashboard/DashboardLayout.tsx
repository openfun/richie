import { Outlet, useLocation } from 'react-router-dom';
import { DashboardSidebar } from 'components/Dashboard/DashboardSidebar';
import { DashboardBreadcrumbsProvider } from 'components/DashboardBreadcrumbs/DashboardBreadcrumbsProvider';
import { DashboardBreadcrumbs } from 'components/DashboardBreadcrumbs';

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
