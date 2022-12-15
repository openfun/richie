import { useParams } from 'react-router-dom';
import Banner, { BannerType } from 'components/Banner';
import { DashboardEditAddress } from 'components/DashboardAddressesManagement/DashboardEditAddress';
import { Spinner } from 'components/Spinner';
import { useAddress } from 'hooks/useAddresses';
import { DashboardPaths } from 'utils/routers/dashboard';
import { useDashboardNavigate } from 'utils/routers/dashboard/useDashboardRouter';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';

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
