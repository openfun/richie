import { useParams } from 'react-router-dom';
import { useDashboardNavigate } from 'utils/routers/dashboard/useDashboardRouter';
import { useCreditCards } from 'hooks/useCreditCards';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
import { DashboardEditCreditCard } from 'components/DashboardCreditCardsManagement/DashboardEditCreditCard';
import { DashboardPaths } from 'utils/routers/dashboard';

/**
 * This component relies on react-router.
 */
export const DashboardEditCreditCardLoader = () => {
  const params = useParams<{ creditCardId: string }>();
  const navigate = useDashboardNavigate();
  const {
    states: { error, isLoading },
    ...creditCards
  } = useCreditCards(params.creditCardId);

  if (isLoading) {
    return <Spinner />;
  }
  if (error) {
    return <Banner message={error} type={BannerType.ERROR} />;
  }
  if (creditCards.items.length > 0) {
    return (
      <DashboardEditCreditCard
        creditCard={creditCards.items[0]}
        onSettled={() => navigate(DashboardPaths.PREFERENCES)}
      />
    );
  }
  return <div />;
};
