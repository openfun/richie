import { Outlet, useMatches } from 'react-router-dom';
import { DashboardRouteHandle } from 'widgets/Dashboard/hooks/useDashboardRouter';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { DashboardBreadcrumbsProvider } from 'widgets/Dashboard/contexts/DashboardBreadcrumbsContext';

export const DashboardLayoutRoute = () => {
  const matches = useMatches();
  const renderOutletOnly = matches.find((match) => {
    const handle = match.handle || {};
    return !!(handle as DashboardRouteHandle).renderLayout;
  });
  return (
    <DashboardBreadcrumbsProvider>
      {renderOutletOnly ? (
        <Outlet />
      ) : (
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      )}
    </DashboardBreadcrumbsProvider>
  );
};
