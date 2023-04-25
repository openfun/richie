import { useParams } from 'react-router-dom';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useOrder } from 'hooks/useOrders';
import { useProduct } from 'hooks/useProduct';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
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
  const order = useOrder(params.orderId);
  const product = useProduct(order.item?.product, { course: order.item?.course });
  const fetching = order.states.fetching || product.states.fetching;

  return (
    <>
      {fetching && !order.item && (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      )}
      {(order.states.error || product.states.error) && (
        <Banner message={(order.states.error ?? product.states.error)!} type={BannerType.ERROR} />
      )}
      {order.item && (
        <DashboardItemOrder
          writable={true}
          order={order.item}
          showDetailsButton={false}
          showCertificate={true}
        />
      )}
    </>
  );
};
