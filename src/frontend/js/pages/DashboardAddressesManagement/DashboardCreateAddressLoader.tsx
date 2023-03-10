import { DashboardPaths } from 'widgets/Dashboard/utils/routers';
import { useDashboardNavigate } from 'widgets/Dashboard/hooks/useDashboardRouter';
import { DashboardCreateAddress } from './DashboardCreateAddress';

/**
 * This component relies on react-router.
 */
export const DashboardCreateAddressLoader = () => {
  const navigate = useDashboardNavigate();
  return <DashboardCreateAddress onSettled={() => navigate(DashboardPaths.PREFERENCES)} />;
};
