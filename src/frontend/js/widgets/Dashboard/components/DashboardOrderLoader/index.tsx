import { useParams } from 'react-router-dom';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useMemo } from 'react';
import { useOmniscientOrder } from 'hooks/useOrders';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
import { useCourseProduct } from 'hooks/useCourseProducts';
import { isCredentialOrder } from 'pages/DashboardCourses/useOrdersEnrollments';
import { handle } from 'utils/errors/handle';
import { orderNeedsSignature } from 'widgets/Dashboard/components/DashboardItem/utils/order';
import { DashboardItemOrder } from '../DashboardItem/Order/DashboardItemOrder';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading order ...',
    description: 'Message displayed while loading an order',
    id: 'components.DashboardOrderLoader.loading',
  },
  signatureNeeded: {
    defaultMessage: 'You need to sign your contract before enrolling in a course run',
    description: 'Banner displayed when the contract is not signed',
    id: 'components.DashboardOrderLoader.signatureNeeded',
  },
  wrongLinkedProductError: {
    defaultMessage: 'This page is not available for this order.',
    description: "Error message displayed when order's linked product type is not handle.",
    id: 'components.DashboardOrderLoader.wrongLinkedProductError',
  },
});

export const DashboardOrderLoader = () => {
  const params = useParams<{ orderId: string }>();
  const {
    item: order,
    states: { fetching: fetchingOrder, error: errorOrder },
  } = useOmniscientOrder(params.orderId);
  const {
    item: courseProduct,
    states: { fetching: fetchingCourseProduct, error: errorCourseProduct },
  } = useCourseProduct({ course_id: order?.course?.code, product_id: order?.product_id });
  const intl = useIntl();

  const credentialOrder = order && isCredentialOrder(order) ? order : undefined;
  const wrongLinkedProductError = useMemo(() => {
    if (order && !credentialOrder) {
      handle(new Error("Order's details page only accept order linked to CREDENTIAL product."));
      return intl.formatMessage(messages.wrongLinkedProductError);
    }
  }, [credentialOrder]);
  const error = errorOrder || errorCourseProduct || wrongLinkedProductError;

  const fetching = fetchingOrder || fetchingCourseProduct;
  const needsSignature = orderNeedsSignature(order, courseProduct?.product);

  return (
    <>
      {fetching && !order && (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      )}
      <div className="dashboard-order-loader__banners">
        {error && <Banner message={error} type={BannerType.ERROR} />}
        {needsSignature && (
          <Banner message={intl.formatMessage(messages.signatureNeeded)} type={BannerType.ERROR} />
        )}
      </div>
      {credentialOrder && (
        <DashboardItemOrder
          writable={true}
          order={credentialOrder}
          showDetailsButton={false}
          showCertificate={true}
        />
      )}
    </>
  );
};
