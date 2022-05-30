import { Children } from 'react';
import { defineMessages, FormattedMessage, FormattedNumber } from 'react-intl';
import CertificateItem from 'components/CourseProductCertificateItem';
import SaleTunnel from 'components/SaleTunnel';
import type * as Joanie from 'types/Joanie';
import CourseRunItem from './CourseRunItem';

const messages = defineMessages({
  enrolled: {
    defaultMessage: 'Enrolled',
    description: 'Message displayed when authenticated user owned the product',
    id: 'components.CourseProductItem.enrolled',
  },
});

export interface Props {
  product: Joanie.Product;
  order?: Joanie.OrderLite;
}

const CourseProductItem = ({ product, order }: Props) => {
  const isOwned = order !== undefined;

  return (
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
          product.target_courses.map((target_course) => (
            <CourseRunItem targetCourse={target_course} order={order} />
          )),
        )}
        {product.certificate && <CertificateItem certificate={product.certificate} order={order} />}
      </ol>
      {!isOwned && (
        <footer className="product-widget__footer">
          <SaleTunnel product={product} />
        </footer>
      )}
    </section>
  );
};

export default CourseProductItem;
