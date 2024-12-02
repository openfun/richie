import { useParams } from 'react-router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useMemo } from 'react';
import { useOmniscientOrder } from 'hooks/useOrders';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
import { isCredentialOrder } from 'pages/DashboardCourses/useOrdersEnrollments';
import { handle } from 'utils/errors/handle';
import { OrderHelper } from 'utils/OrderHelper';
import { OrderState } from 'types/Joanie';
import { DashboardItemOrder } from '../DashboardItem/Order/DashboardItemOrder';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading order ...',
    description: 'Message displayed while loading an order',
    id: 'components.DashboardOrderLoader.loading',
  },
  signatureNeeded: {
    defaultMessage: 'You have to {signLink} to finalize your subscription.',
    description: 'Banner displayed when the contract is not signed',
    id: 'components.DashboardOrderLoader.signatureNeeded',
  },
  signLink: {
    defaultMessage: 'sign your training contract',
    description: 'Link to sign the contract',
    id: 'components.DashboardOrderLoader.signLink',
  },
  wrongLinkedProductError: {
    defaultMessage: 'This page is not available for this order.',
    description: "Error message displayed when order's linked product type is not handle.",
    id: 'components.DashboardOrderLoader.wrongLinkedProductError',
  },
  paymentMethodMissing: {
    defaultMessage: 'You have to {definePaymentMethodLink} to finalize your subscription.',
    description: 'Error message displayed when no payment method is defined.',
    id: 'components.DashboardOrderLoader.paymentMethodMissing',
  },
  definePaymentMethodLink: {
    defaultMessage: 'define a payment method',
    description: 'Link to define a payment method',
    id: 'components.DashboardOrderLoader.definePaymentMethodLink',
  },
});

export const DashboardOrderLoader = () => {
  const params = useParams<{ orderId: string }>();
  const {
    item: order,
    states: { fetching: fetchingOrder, error: errorOrder },
  } = useOmniscientOrder(params.orderId);
  const intl = useIntl();

  const credentialOrder = order && isCredentialOrder(order) ? order : undefined;
  const wrongLinkedProductError = useMemo(() => {
    if (order && !credentialOrder) {
      handle(new Error("Order's details page only accept order linked to CREDENTIAL product."));
      return intl.formatMessage(messages.wrongLinkedProductError);
    }
  }, [credentialOrder]);
  const error = errorOrder || wrongLinkedProductError;
  const fetching = fetchingOrder;
  const needsSignature = order ? OrderHelper.orderNeedsSignature(order) : false;
  const needsPaymentMethod = order?.state === OrderState.TO_SAVE_PAYMENT_METHOD;

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
        {order && needsSignature && (
          <Banner
            message={
              intl.formatMessage(messages.signatureNeeded, {
                signLink: (
                  <a href="#dashboard-item-contract">
                    <FormattedMessage {...messages.signLink} />
                  </a>
                ),
              }) as any
            }
            type={BannerType.ERROR}
          />
        )}
        {order && needsPaymentMethod && (
          <Banner
            message={
              intl.formatMessage(messages.paymentMethodMissing, {
                definePaymentMethodLink: (
                  <a href="#dashboard-item-payment-method">
                    <FormattedMessage {...messages.definePaymentMethodLink} />
                  </a>
                ),
              }) as any
            }
            type={BannerType.ERROR}
          />
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
