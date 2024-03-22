import { useParams } from 'react-router-dom';
import Banner, { BannerType } from 'components/Banner';
import { Spinner } from 'components/Spinner';
import { useAddress } from 'hooks/useAddresses';
import { useDashboardNavigate } from 'widgets/Dashboard/hooks/useDashboardRouter';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { DashboardEditAddress } from './DashboardEditAddress';

/**
 * This component relies on react-router.
 */
export const DashboardEditAddressLoader = () => {
  const params = useParams<{ addressId: string }>();
  const navigate = useDashboardNavigate();
  const {
    states: { error, isPending },
    ...address
  } = useAddress(params.addressId);
  useBreadcrumbsPlaceholders({
    addressTitle: address.item?.title,
  });

  return (
    <>
      {isPending && <Spinner />}
      {error && <Banner message={error} type={BannerType.ERROR} />}
      {address.item && (
        <DashboardEditAddress
          address={address.item}
          onSettled={() => {
            navigate(LearnerDashboardPaths.PREFERENCES);
          }}
        />
      )}
    </>
  );
};
