import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { DashboardSidebar, useDashboardSidebar } from 'components/Dashboard/DashboardSidebar';
import { Icon } from 'components/Icon';
import { Button } from 'components/Button';
import { useSession } from 'data/SessionProvider';

export const DashboardLayout = () => {
  const dashboardSidebar = useDashboardSidebar();
  const location = useLocation();

  useEffect(() => {
    // Close the sidebar when changing location. ( Only effective on mobile )
    dashboardSidebar.close();
  }, [location.pathname]);

  console.log(useSession().user);

  return (
    <div className="dashboard">
      <DashboardSidebar {...dashboardSidebar} />
      <div className="dashboard__container">
        <header>
          {dashboardSidebar.isMobile && (
            <Button size="nano" onClick={() => dashboardSidebar.toggle()}>
              <Icon name="icon-menu" className="button__icon" />
            </Button>
          )}
          header
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
