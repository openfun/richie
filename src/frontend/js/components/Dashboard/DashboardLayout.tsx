import { Outlet } from 'react-router-dom';
import { DashboardSidebar, useDashboardSidebar } from 'components/Dashboard/DashboardSidebar';
import { Icon } from 'components/Icon';
import { Button } from 'components/Button';

export const DashboardLayout = () => {
  const dashboardSidebar = useDashboardSidebar();

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
