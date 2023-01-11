import { Children, useMemo } from 'react';
import { defineMessages, FormattedMessage, FormattedNumber } from 'react-intl';
import { CourseProductProvider } from 'data/CourseProductProvider';
import CertificateItem from 'components/CourseProductCertificateItem';
import SaleTunnel from 'components/SaleTunnel';
import type * as Joanie from 'types/Joanie';
import { useProduct } from 'hooks/useProduct';
import { Spinner } from 'components/Spinner';
import { useOrder } from 'hooks/useOrders';
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
  const isOwned = useMemo(() => product?.orders?.length > 0, [productQuery.item]);
  const { item: order, ...orderQuery } = useOrder(product?.orders[0], {
    enabled: product?.orders?.length > 0,
  });

  const targetCourses = useMemo(() => {
    if (order) {
      return order.target_courses;
    }

    if (product) {
      return product.target_courses;
    }

    return [];
  }, [productQuery.item, order]);

  if (productQuery.states.fetching || orderQuery.states.fetching) {
    return (
      <Spinner aria-labelledby="loading-course">
        <span id="loading-course">
          <FormattedMessage {...messages.loading} />
        </span>
      </Spinner>
    );
  }

  if (!product) return null;

  return (
    <CourseProductProvider courseCode={courseCode} productId={productId}>
      <section className="product-widget">
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
                orderQuery.methods.refetch();
              }}
            />
          </footer>
        )}
      </section>
    </CourseProductProvider>
  );
};

export default CourseProductItem;
