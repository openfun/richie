import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { useDashboardNavigate } from 'widgets/Dashboard/hooks/useDashboardRouter';
import { DashboardCreateAddress } from './DashboardCreateAddress';

/**
 * This component relies on react-router.
 */
export const DashboardCreateAddressLoader = () => {
  const navigate = useDashboardNavigate();
  return <DashboardCreateAddress onSettled={() => navigate(LearnerDashboardPaths.PREFERENCES)} />;
};
