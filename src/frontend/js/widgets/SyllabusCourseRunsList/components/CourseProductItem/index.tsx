import { Children, useMemo } from 'react';
import { defineMessages, FormattedMessage, FormattedNumber } from 'react-intl';
import { useCourseProduct } from 'hooks/useCourseProducts';
import type * as Joanie from 'types/Joanie';
import { OrderState } from 'types/Joanie';
import { Spinner } from 'components/Spinner';
import { useOrders } from 'hooks/useOrders';
import { Icon, IconTypeEnum } from 'components/Icon';
import { CourseProductProvider } from 'contexts/CourseProductContext';
import PurchaseButton from 'components/PurchaseButton';
import CertificateItem from './components/CourseProductCertificateItem';
import CourseRunItem from './components/CourseRunItem';

const messages = defineMessages({
  purchased: {
    defaultMessage: 'Purchased',
    description: 'Message displayed when authenticated user owned the product',
    id: 'components.CourseProductItem.purchased',
  },
  pending: {
    defaultMessage: 'Pending',
    description:
      'Message displayed when authenticated user has purchased the product but order is still pending',
    id: 'components.CourseProductItem.pending',
  },
  loading: {
    defaultMessage: 'Loading product information...',
    description:
      'Accessible text for the initial loading spinner displayed when product is fetching',
    id: 'components.CourseProductItem.loadingInitial',
  },
});

export interface Props {
  productId: Joanie.Product['id'];
  courseCode: Joanie.CourseLight['code'];
}

const CourseProductItem = ({ productId, courseCode }: Props) => {
  const productQuery = useCourseProduct(courseCode, { productId });
  const product = productQuery.item?.product;
  const ordersQuery = useOrders({
    product: productId,
    course: courseCode,
    state: [OrderState.VALIDATED, OrderState.PENDING],
  });

  const order = useMemo(
    () => ordersQuery.items.find(({ state }) => state === OrderState.VALIDATED),
    [ordersQuery.items],
  );

  const hasPurchased = useMemo(() => ordersQuery.items?.length > 0, [ordersQuery.items]);

  const targetCourses = useMemo(() => {
    if (order) {
      return order.target_courses;
    }

    if (product) {
      return product.target_courses;
    }

    return [];
  }, [productQuery.item, order]);

  const hasError = Boolean(productQuery.states.error);
  const isFetching = productQuery.states.fetching || ordersQuery.states.fetching;

  return (
    <CourseProductProvider courseCode={courseCode} productId={productId}>
      <section className={['product-widget', hasError && 'product-widget--has-error'].join(' ')}>
        {isFetching && (
          <div className="product-widget__overlay">
            <Spinner aria-labelledby="loading-course" theme="light" size="large">
              <span id="loading-course">
                <FormattedMessage {...messages.loading} />
              </span>
            </Spinner>
          </div>
        )}
        {hasError && (
          <p className="product-widget__content">
            <Icon name={IconTypeEnum.WARNING} size="small" />
            {productQuery.states.error}
          </p>
        )}
        {!hasError && product && (
          <>
            <header className="product-widget__header">
              <h3 className="product-widget__title">{product.title}</h3>
              <strong className="product-widget__price h6">
                {order && <FormattedMessage {...messages.purchased} />}
                {hasPurchased && !order && <FormattedMessage {...messages.pending} />}
                {!hasPurchased && (
                  <FormattedNumber
                    currency={product.price_currency}
                    value={product.price}
                    style="currency"
                  />
                )}
              </strong>
            </header>
            <ol className="product-widget__content">
              {Children.toArray(
                targetCourses.map((target_course: any) => (
                  <CourseRunItem targetCourse={target_course} order={order} />
                )),
              )}
              {product.certificate_definition && (
                <CertificateItem
                  certificateDefinition={product.certificate_definition}
                  order={order}
                />
              )}
            </ol>
            <footer className="product-widget__footer">
              <PurchaseButton product={product} disabled={hasPurchased} />
            </footer>
          </>
        )}
      </section>
    </CourseProductProvider>
  );
};

export default CourseProductItem;
