import { useParams } from 'react-router-dom';
import { useDashboardNavigate } from 'utils/routers/dashboard/useDashboardRouter';
import { useCreditCard } from 'hooks/useCreditCards';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
import { DashboardEditCreditCard } from 'components/DashboardCreditCardsManagement/DashboardEditCreditCard';
import { DashboardPaths } from 'utils/routers/dashboard';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';

/**
 * This component relies on react-router.
 */
export const DashboardEditCreditCardLoader = () => {
  const params = useParams<{ creditCardId: string }>();
  const navigate = useDashboardNavigate();
  const {
    states: { error, isLoading },
    ...creditCard
  } = useCreditCard(params.creditCardId);

  useBreadcrumbsPlaceholders({
    creditCardTitle: creditCard.item?.title ?? '',
  });

  if (isLoading) {
    return <Spinner />;
  }
  if (error) {
    return <Banner message={error} type={BannerType.ERROR} />;
  }
  if (creditCard.item) {
    return (
      <DashboardEditCreditCard
        creditCard={creditCard.item}
        onSettled={() => navigate(DashboardPaths.PREFERENCES)}
      />
    );
  }
  return <div />;
};
