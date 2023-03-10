import { useParams } from 'react-router-dom';
import { DashboardPaths } from 'widgets/Dashboard/utils/routers';
import { useDashboardNavigate } from 'widgets/Dashboard/hooks/useDashboardRouter';
import { useCreditCard } from 'hooks/useCreditCards';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';
import { DashboardEditCreditCard } from './DashboardEditCreditCard';

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
