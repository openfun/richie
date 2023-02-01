import { Children, useMemo } from 'react';
import { defineMessages, FormattedMessage, FormattedNumber } from 'react-intl';
import { CourseProductProvider } from 'data/CourseProductProvider';
import CertificateItem from 'components/CourseProductCertificateItem';
import SaleTunnel from 'components/SaleTunnel';
import type * as Joanie from 'types/Joanie';
import { useProduct } from 'hooks/useProduct';
import { Spinner } from 'components/Spinner';
import { useOrders } from 'hooks/useOrders';
import { OrderState } from 'types/Joanie';
import { Icon } from 'components/Icon';
import CourseRunItem from './CourseRunItem';

const messages = defineMessages({
  enrolled: {
    defaultMessage: 'Enrolled',
    description: 'Message displayed when authenticated user owned the product',
    id: 'components.CourseProductItem.enrolled',
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
  courseCode: Joanie.Course['code'];
}

const CourseProductItem = ({ productId, courseCode }: Props) => {
  const productQuery = useProduct(productId, { course: courseCode });
  const product = productQuery.item;
  const ordersQuery = useOrders({
    product: productId,
    course: courseCode,
    state: [OrderState.VALIDATED, OrderState.PENDING],
  });

  const order = useMemo(
    () => ordersQuery.items.find(({ state }) => state === OrderState.VALIDATED),
    [ordersQuery.items],
  );
  const isOwned = useMemo(() => ordersQuery.items?.length > 0, [ordersQuery.items]);

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
            <Icon name="icon-warning" size="small" />
            {productQuery.states.error}
          </p>
        )}
        {!hasError && product && (
          <>
            <header className="product-widget__header">
              <h3 className="product-widget__title">{product.title}</h3>
              <strong className="product-widget__price h6">
                {isOwned ? (
                  <FormattedMessage {...messages.enrolled} />
                ) : (
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
                targetCourses.map((target_course) => (
                  <CourseRunItem targetCourse={target_course} order={order} />
                )),
              )}
              {product.certificate && (
                <CertificateItem certificate={product.certificate} order={order} />
              )}
            </ol>
            {!isOwned && (
              <footer className="product-widget__footer">
                <SaleTunnel
                  product={product}
                  onSuccess={() => {
                    productQuery.methods.refetch();
                    ordersQuery.methods.refetch();
                  }}
                />
              </footer>
            )}
          </>
        )}
      </section>
    </CourseProductProvider>
  );
};

export default CourseProductItem;
