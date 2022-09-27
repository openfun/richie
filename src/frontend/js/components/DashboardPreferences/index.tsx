import { DashboardAddressesManagement } from 'components/DashboardAddressesManagement';
import { DashboardPaths } from 'utils/routers/dashboard';
import { useDashboardNavigate } from 'utils/routers/dashboard/useDashboardRouter';

/**
 * This component relies on react-router.
 */
export const DashboardPreferences = () => {
  const navigate = useDashboardNavigate();
  return (
    <div>
      <DashboardAddressesManagement
        onClickCreate={() => navigate(DashboardPaths.PREFERENCES_ADDRESS_CREATION)}
        onClickEdit={(address) =>
          navigate(DashboardPaths.PREFERENCES_ADDRESS_EDITION, {
            addressId: address.id,
          })
        }
      />
    </div>
  );
};
