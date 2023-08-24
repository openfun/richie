import { Children, useMemo } from 'react';
import { defineMessages, FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import c from 'classnames';
import type * as Joanie from 'types/Joanie';
import { OrderState } from 'types/Joanie';
import { Spinner } from 'components/Spinner';
import { useCourseProduct } from 'hooks/useCourseProducts';
import { useOmniscientOrders } from 'hooks/useOrders';
import { Icon, IconTypeEnum } from 'components/Icon';
import { CourseProductProvider } from 'contexts/CourseProductContext';
import PurchaseButton from 'components/PurchaseButton';
import { Maybe } from 'types/utils';
import useDateFormat from 'hooks/useDateFormat';
import { ProductHelper } from 'utils/ProductHelper';
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
  fromTo: {
    defaultMessage: 'From {from} to {to}',
    description: 'Course run date range',
    id: 'components.CourseProductItem.fromTo',
  },
  availableIn: {
    defaultMessage: 'Available in {languages}',
    description: 'Course run languages',
    id: 'components.CourseProductItem.availableIn',
  },
});

export interface Props {
  compact?: boolean;
  courseCode: Joanie.CourseLight['code'];
  productId: Joanie.Product['id'];
}

type HeaderProps = {
  compact: boolean;
  hasPurchased: boolean;
  order: Maybe<Joanie.Order>;
  product: Joanie.Product;
};
const Header = ({ product, order, hasPurchased, compact }: HeaderProps) => {
  const intl = useIntl();
  const formatDate = useDateFormat();

  const canShowMetadata = useMemo(() => {
    return compact && !order;
  }, [compact, hasPurchased]);

  const [minDate, maxDate] = useMemo(() => {
    if (!canShowMetadata) return [undefined, undefined];
    return ProductHelper.getDateRange(product);
  }, [canShowMetadata, product]);

  const languages = useMemo(() => {
    if (!canShowMetadata) return '';
    return ProductHelper.getLanguages(product, true, intl);
  }, [canShowMetadata, product, intl]);

  return (
    <header className="product-widget__header">
      <div className="product-widget__header-main">
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
      </div>
      {canShowMetadata && (
        <>
          <p
            className="product-widget__header-metadata"
            data-testid="product-widget__header-metadata-dates"
          >
            <Icon name={IconTypeEnum.CALENDAR} size="small" />
            <FormattedMessage
              {...messages.fromTo}
              values={{
                from: formatDate(minDate!),
                to: formatDate(maxDate!),
              }}
            />
          </p>
          <p
            className="product-widget__header-metadata"
            data-testid="product-widget__header-metadata-languages"
          >
            <Icon name={IconTypeEnum.LANGUAGES} size="small" />
            <FormattedMessage {...messages.availableIn} values={{ languages }} />
          </p>
        </>
      )}
    </header>
  );
};
const Content = ({ product, order }: { product: Joanie.Product; order?: Joanie.Order }) => {
  const targetCourses = useMemo(() => {
    if (order) {
      return order.target_courses;
    }

    if (product) {
      return product.target_courses;
    }

    return [];
  }, [product, order]);

  return (
    <ol className="product-widget__content">
      {Children.toArray(
        targetCourses.map((target_course) => (
          <CourseRunItem targetCourse={target_course} order={order} />
        )),
      )}
      {product.certificate_definition && (
        <CertificateItem certificateDefinition={product.certificate_definition} order={order} />
      )}
    </ol>
  );
};

const CourseProductItem = ({ productId, courseCode, compact = false }: Props) => {
  const productQuery = useCourseProduct(courseCode, { productId });
  const product = productQuery.item?.product;
  const ordersQuery = useOmniscientOrders({
    product: productId,
    course: courseCode,
    state: [OrderState.VALIDATED, OrderState.PENDING],
  });

  const order = useMemo(
    () => ordersQuery.items.find(({ state }) => state === OrderState.VALIDATED),
    [ordersQuery.items],
  );

  const hasPurchased = useMemo(() => ordersQuery.items?.length > 0, [ordersQuery.items]);
  const hasError = Boolean(productQuery.states.error);
  const isFetching = productQuery.states.fetching || ordersQuery.states.fetching;
  const canShowContent = !compact || order;

  return (
    <CourseProductProvider courseCode={courseCode} productId={productId}>
      <section
        className={c('product-widget', {
          'product-widget--has-error': hasError,
          'product-widget--compact': compact,
          'product-widget--purchased': hasPurchased,
        })}
      >
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
            <Header product={product} order={order} hasPurchased={hasPurchased} compact={compact} />
            {canShowContent && <Content product={product} order={order} />}
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
