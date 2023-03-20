import { PropsWithChildren, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { LearnerDashboardSidebar } from 'widgets/Dashboard/components/LearnerDashboardSidebar';
import { DashboardBreadcrumbsProvider } from 'widgets/Dashboard/contexts/DashboardBreadcrumbsContext';
import { DashboardBreadcrumbs } from 'widgets/Dashboard/components/DashboardBreadcrumbs';

interface DashboardLayoutProps extends PropsWithChildren<any> {
  sidebar?: ReactNode;
}

export const DashboardLayout = ({ children, sidebar }: DashboardLayoutProps) => {
  const location = useLocation();
  return (
    <DashboardBreadcrumbsProvider>
      <div className="dashboard">
        {sidebar || <LearnerDashboardSidebar />}
        <div className="dashboard__content">
          <header>
            <DashboardBreadcrumbs />
          </header>
          <main data-testid={`location-display-${location.pathname}`}>{children}</main>
        </div>
      </div>
    </DashboardBreadcrumbsProvider>
  );
};
