import { useParams } from 'react-router-dom';
import { useDashboardNavigate } from 'widgets/Dashboard/hooks/useDashboardRouter';
import { useCreditCard } from 'hooks/useCreditCards';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { DashboardEditCreditCard } from './DashboardEditCreditCard';

/**
 * This component relies on react-router.
 */
export const DashboardEditCreditCardLoader = () => {
  const params = useParams<{ creditCardId: string }>();
  const navigate = useDashboardNavigate();
  const {
    states: { error, isPending },
    ...creditCard
  } = useCreditCard(params.creditCardId);

  useBreadcrumbsPlaceholders({
    creditCardTitle: creditCard.item?.title ?? '',
  });

  if (isPending) {
    return <Spinner />;
  }
  if (error) {
    return <Banner message={error} type={BannerType.ERROR} />;
  }
  if (creditCard.item) {
    return (
      <DashboardEditCreditCard
        creditCard={creditCard.item}
        onSettled={() => navigate(LearnerDashboardPaths.PREFERENCES)}
      />
    );
  }
  return <div />;
};
