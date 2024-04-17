import { PropsWithChildren, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import c from 'classnames';
import { LearnerDashboardSidebar } from 'widgets/Dashboard/components/LearnerDashboardSidebar';
import { DashboardBreadcrumbs } from 'widgets/Dashboard/components/DashboardBreadcrumbs';

interface DashboardLayoutProps extends PropsWithChildren<any> {
  sidebar?: ReactNode;
  hideSidebar?: boolean;
  filters?: ReactNode;
  className?: string;
}

export const DashboardLayout = ({
  children,
  sidebar,
  filters,
  className,
  hideSidebar = false,
}: DashboardLayoutProps) => {
  const location = useLocation();
  return (
    <div className={c('dashboard', className)}>
      <div className="dashboard__sidebar">
        {!hideSidebar && (sidebar || <LearnerDashboardSidebar />)}
      </div>
      <main className="dashboard__main">
        <header>
          <DashboardBreadcrumbs />
          {!!filters && <div className="dashboard__filters">{filters}</div>}
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
