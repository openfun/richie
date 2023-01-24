import { useParams } from 'react-router-dom';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';
import { useOrder } from 'hooks/useOrders';
import { useProduct } from 'hooks/useProduct';
import { Spinner } from '../Spinner';
import Banner, { BannerType } from '../Banner';
import { DashboardItemOrder } from '../DashboardItem/Order/DashboardItemOrder';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading order ...',
    description: 'Message displayed while loading an order',
    id: 'components.DashboardOrderLoader.loading',
  },
});

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
      {fetching && !order.item && (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      )}
      {(error || product.states.error) && (
        <Banner message={(error ?? product.states.error)!} type={BannerType.ERROR} />
      )}
      {order.item && (
        <DashboardItemOrder writable={true} order={order.item} showDetailsButton={false} />
      )}
    </>
  );
};
