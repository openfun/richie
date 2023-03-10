import { useParams } from 'react-router-dom';
import Banner, { BannerType } from 'components/Banner';
import { Spinner } from 'components/Spinner';
import { useAddress } from 'hooks/useAddresses';
import { DashboardPaths } from 'widgets/Dashboard/utils/routers';
import { useDashboardNavigate } from 'widgets/Dashboard/hooks/useDashboardRouter';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';
import { DashboardEditAddress } from './DashboardEditAddress';

/**
 * This component relies on react-router.
 */
export const DashboardEditAddressLoader = () => {
  const params = useParams<{ addressId: string }>();
  const navigate = useDashboardNavigate();
  const {
    states: { error, isLoading },
    ...address
  } = useAddress(params.addressId);
  useBreadcrumbsPlaceholders({
    addressTitle: address.item?.title,
  });

  return (
    <>
      {isLoading && <Spinner />}
      {error && <Banner message={error} type={BannerType.ERROR} />}
      {address.item && (
        <DashboardEditAddress
          address={address.item}
          onSettled={() => {
            navigate(DashboardPaths.PREFERENCES);
          }}
        />
      )}
    </>
  );
};
