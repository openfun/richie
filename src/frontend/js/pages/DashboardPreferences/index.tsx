import { DashboardCreditCardsManagement } from 'pages/DashboardCreditCardsManagement';
import { DashboardAddressesManagement } from 'pages/DashboardAddressesManagement';
import { useDashboardNavigate } from 'widgets/Dashboard/hooks/useDashboardRouter';
import DashboardOpenEdxProfile from 'pages/DashboardOpenEdxProfile';

import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { APIBackend } from 'types/api';
import context from 'utils/context';

/**
 * This component relies on react-router.
 */
export const DashboardPreferences = () => {
  const navigate = useDashboardNavigate();
  const isKeycloakBackend = [APIBackend.KEYCLOAK, APIBackend.FONZIE_KEYCLOAK].includes(
    context?.authentication.backend as APIBackend,
  );
  return (
    <div className="dashboard-preferences">
      {!isKeycloakBackend && <DashboardOpenEdxProfile />}
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
