import { Outlet, useMatches } from 'react-router-dom';
import { CunninghamProvider } from '@openfun/cunningham-react';
import { DashboardRouteHandle } from 'widgets/Dashboard/hooks/useDashboardRouter';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';

export const DashboardLayoutRoute = () => {
  const matches = useMatches();
  const renderOutletOnly = matches.find((match) => {
    const handle = match.handle || {};
    return !!(handle as DashboardRouteHandle).renderLayout;
  });
  return (
    <CunninghamProvider>
      {renderOutletOnly ? (
        <Outlet />
      ) : (
        <DashboardLayout>
          <Outlet />
        </DashboardLayout>
      )}
    </CunninghamProvider>
  );
};
