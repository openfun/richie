import { useDashboardNavigate } from 'widgets/Dashboard/hooks/useDashboardRouter';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { DashboardCreateAddress } from './DashboardCreateAddress';

/**
 * This component relies on react-router.
 */
export const DashboardCreateAddressLoader = () => {
  const navigate = useDashboardNavigate();
  return <DashboardCreateAddress onSettled={() => navigate(LearnerDashboardPaths.PREFERENCES)} />;
};
