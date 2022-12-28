import { useParams } from 'react-router-dom';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';
import { useOrder } from 'hooks/useOrders';
import { useProduct } from 'hooks/useProduct';
import { Spinner } from '../Spinner';
import Banner, { BannerType } from '../Banner';
import { DashboardItemOrder } from '../DashboardItem/Order/DashboardItemOrder';

export const DashboardOrderLoader = () => {
  const params = useParams<{ orderId: string }>();
  const {
    states: { error, fetching },
    ...order
  } = useOrder(params.orderId);

  const product = useProduct(order.item?.product);
  useBreadcrumbsPlaceholders({
    orderTitle: product.item?.title ?? '',
  });

  return (
    <>
      {fetching && !order.item && <Spinner />}
      {(error || product.states.error) && (
        <Banner message={(error ?? product.states.error)!} type={BannerType.ERROR} />
      )}
      {order.item && (
        <DashboardItemOrder writable={true} order={order.item} detailsButton={false} />
      )}
    </>
  );
};
