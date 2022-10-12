import { DashboardAddressesManagement } from 'components/DashboardAddressesManagement';
import { DashboardPaths } from 'utils/routers/dashboard';
import { useDashboardNavigate } from 'utils/routers/dashboard/useDashboardRouter';
import { DashboardCreditCardsManagement } from 'components/DashboardCreditCardsManagement';

/**
 * This component relies on react-router.
 */
export const DashboardPreferences = () => {
  const navigate = useDashboardNavigate();
  return (
    <div className="dashboard-preferences">
      <DashboardAddressesManagement
        onClickCreate={() => navigate(DashboardPaths.PREFERENCES_ADDRESS_CREATION)}
        onClickEdit={(address) =>
          navigate(DashboardPaths.PREFERENCES_ADDRESS_EDITION, {
            addressId: address.id,
          })
        }
      />
      <DashboardCreditCardsManagement
        onClickEdit={(creditCard) =>
          navigate(DashboardPaths.PREFERENCES_CREDIT_CARD_EDITION, {
            creditCardId: creditCard.id,
          })
        }
      />
    </div>
  );
};
