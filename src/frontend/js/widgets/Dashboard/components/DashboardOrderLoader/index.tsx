import { useParams } from 'react-router-dom';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useOmniscientOrder } from 'hooks/useOrders';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
import { CourseLight } from 'types/Joanie';
import { useCourseProduct } from 'hooks/useCourseProducts';
import { DashboardItemOrder } from '../DashboardItem/Order/DashboardItemOrder';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading order ...',
    description: 'Message displayed while loading an order',
    id: 'components.DashboardOrderLoader.loading',
  },
  signatureNeeded: {
    defaultMessage: 'You need to sign your contract before enrolling to course runs',
    description: 'Banner displayed when the contract is not signed',
    id: 'components.DashboardOrderLoader.signatureNeeded',
  },
});

export const DashboardOrderLoader = () => {
  const params = useParams<{ orderId: string }>();
  const order = useOmniscientOrder(params.orderId);
  const course = order.item?.course as CourseLight;
  const courseProduct = useCourseProduct(course?.code, { productId: order.item?.product });
  const fetching = order.states.fetching || courseProduct.states.fetching;
  const needsSignature = order.item?.contract && !order.item?.contract.signed_on;
  const intl = useIntl();

  return (
    <>
      {fetching && !order.item && (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      )}
      <div className="dashboard-order-loader__banners">
        {(order.states.error || courseProduct.states.error) && (
          <Banner
            message={(order.states.error ?? courseProduct.states.error)!}
            type={BannerType.ERROR}
          />
        )}
        {needsSignature && (
          <Banner message={intl.formatMessage(messages.signatureNeeded)} type={BannerType.ERROR} />
        )}
      </div>
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
