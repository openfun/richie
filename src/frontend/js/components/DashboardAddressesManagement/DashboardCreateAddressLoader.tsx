import { DashboardCreateAddress } from 'components/DashboardAddressesManagement/DashboardCreateAddress';
import { DashboardPaths } from 'utils/routers/dashboard';
import { useDashboardNavigate } from 'utils/routers/dashboard/useDashboardRouter';

/**
 * This component relies on react-router.
 */
export const DashboardCreateAddressLoader = () => {
  const navigate = useDashboardNavigate();
  return <DashboardCreateAddress onSettled={() => navigate(DashboardPaths.PREFERENCES)} />;
};
