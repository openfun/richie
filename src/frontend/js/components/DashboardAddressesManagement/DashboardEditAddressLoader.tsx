import { useParams } from 'react-router-dom';
import Banner, { BannerType } from 'components/Banner';
import { DashboardEditAddress } from 'components/DashboardAddressesManagement/DashboardEditAddress';
import { Spinner } from 'components/Spinner';
import { useAddresses } from 'hooks/useAddresses';
import { DashboardPaths } from 'utils/routers/dashboard';
import { useDashboardNavigate } from 'utils/routers/dashboard/useDashboardRouter';

/**
 * This component relies on react-router.
 */
export const DashboardEditAddressLoader = () => {
  const params = useParams<{ addressId: string }>();
  const navigate = useDashboardNavigate();
  const {
    states: { error, isLoading },
    ...addresses
  } = useAddresses(params.addressId);
  return (
    <>
      {isLoading && <Spinner />}
      {error && <Banner message={error} type={BannerType.ERROR} />}
      {addresses.items.length > 0 && (
        <DashboardEditAddress
          address={addresses.items[0]}
          onSettled={() => {
            navigate(DashboardPaths.PREFERENCES);
          }}
        />
      )}
    </>
  );
};
