import { DashboardCreditCardsManagement } from 'pages/DashboardCreditCardsManagement';
import { DashboardAddressesManagement } from 'pages/DashboardAddressesManagement';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { useDashboardNavigate } from 'widgets/Dashboard/hooks/useDashboardRouter';

/**
 * This component relies on react-router.
 */
export const DashboardPreferences = () => {
  const navigate = useDashboardNavigate();
  return (
    <div className="dashboard-preferences">
      <DashboardAddressesManagement
        onClickCreate={() => navigate(LearnerDashboardPaths.PREFERENCES_ADDRESS_CREATION)}
        onClickEdit={(address) =>
          navigate(LearnerDashboardPaths.PREFERENCES_ADDRESS_EDITION, {
            addressId: address.id,
          })
        }
      />
      <DashboardCreditCardsManagement
        onClickEdit={(creditCard) =>
          navigate(LearnerDashboardPaths.PREFERENCES_CREDIT_CARD_EDITION, {
            creditCardId: creditCard.id,
          })
        }
      />
    </div>
  );
};
