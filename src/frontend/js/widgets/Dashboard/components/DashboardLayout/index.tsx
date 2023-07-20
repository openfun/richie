import { PropsWithChildren, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { LearnerDashboardSidebar } from 'widgets/Dashboard/components/LearnerDashboardSidebar';
import { DashboardBreadcrumbs } from 'widgets/Dashboard/components/DashboardBreadcrumbs';

interface DashboardLayoutProps extends PropsWithChildren<any> {
  sidebar?: ReactNode;
  filters?: ReactNode;
}

export const DashboardLayout = ({ children, sidebar, filters }: DashboardLayoutProps) => {
  const location = useLocation();
  return (
    <div className="dashboard">
      <div className="dashboard__sidebar">{sidebar || <LearnerDashboardSidebar />}</div>
      <main className="dashboard__main">
        <header>
          <DashboardBreadcrumbs />
          <div className="dashboard__filters">{filters}</div>
        </header>
        <div className="dashboard__content" data-testid={`location-display-${location.pathname}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

DashboardLayout.Section = ({ children }: PropsWithChildren) => (
  <div className="dashboard__section">{children}</div>
);

DashboardLayout.NestedSection = ({ children }: PropsWithChildren) => (
  <div className="dashboard__nested_section">{children}</div>
);
