import { DashboardCreditCardsManagement } from 'pages/DashboardCreditCardsManagement';
import { DashboardAddressesManagement } from 'pages/DashboardAddressesManagement';
import { useDashboardNavigate } from 'widgets/Dashboard/hooks/useDashboardRouter';
import DashboardOpenEdxProfile from 'pages/DashboardOpenEdxProfile';

import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';

/**
 * This component relies on react-router.
 */
export const DashboardPreferences = () => {
  const navigate = useDashboardNavigate();
  return (
    <div className="dashboard-preferences">
      <DashboardOpenEdxProfile />
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
