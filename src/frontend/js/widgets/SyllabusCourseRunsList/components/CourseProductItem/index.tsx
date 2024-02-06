import { Children, useEffect, useMemo } from 'react';
import { defineMessages, FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import c from 'classnames';
import {
  ProductType,
  OrderState,
  CourseLight,
  Product,
  CredentialOrder,
  CredentialProduct,
} from 'types/Joanie';
import { useCourseProduct } from 'hooks/useCourseProducts';
import { Spinner } from 'components/Spinner';
import { Icon, IconTypeEnum } from 'components/Icon';
import { Maybe } from 'types/utils';
import useDateFormat from 'hooks/useDateFormat';
import { ProductHelper } from 'utils/ProductHelper';
import useProductOrder from 'hooks/useProductOrder';
import { OrderHelper } from 'utils/OrderHelper';
import { handle } from 'utils/errors/handle';
import { ProductSignatureHeader } from 'widgets/SyllabusCourseRunsList/components/CourseProductItem/components/ProductSignatureHeader';
import CertificateItem from './components/CourseProductCertificateItem';
import CourseRunItem from './components/CourseRunItem';
import CourseProductItemFooter from './CourseProductItemFooter';

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

export interface CourseProductItemProps {
  compact?: boolean;
  course: CourseLight;
  productId: Product['id'];
}

type HeaderProps = {
  compact: boolean;
  hasPurchased: boolean;
  canPurchase: boolean;
  order: Maybe<CredentialOrder>;
  product: Product;
};
const Header = ({ product, order, hasPurchased, canPurchase, compact }: HeaderProps) => {
  const intl = useIntl();
  const formatDate = useDateFormat();

  // compact mode is available for product until they got a VALIDATED order.
  const canShowMetadata = useMemo(() => {
    return compact && (!order || [OrderState.SUBMITTED, OrderState.PENDING].includes(order!.state));
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
          {order?.state === OrderState.VALIDATED && <FormattedMessage {...messages.purchased} />}
          {order?.state === OrderState.SUBMITTED && <FormattedMessage {...messages.pending} />}
          {canPurchase && (
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
const Content = ({ product, order }: { product: Product; order?: CredentialOrder }) => {
  const needsSignature = order
    ? OrderHelper.orderNeedsSignature(order, product.contract_definition)
    : false;
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
      {needsSignature && <ProductSignatureHeader order={order} />}
      {Children.toArray(
        targetCourses.map((target_course) => (
          <CourseRunItem targetCourse={target_course} order={order} product={product} />
        )),
      )}
      {product.certificate_definition && (
        <CertificateItem certificateDefinition={product.certificate_definition} order={order} />
      )}
    </ol>
  );
};

const CourseProductItem = ({ productId, course, compact = false }: CourseProductItemProps) => {
  // FIXME(rlecellier): useCourseProduct need's a filter on product.type that only return
  // CredentialOrder
  const { item: courseProductRelation, states: productQueryStates } = useCourseProduct({
    product_id: productId,
    course_id: course.code,
  });
  const product = courseProductRelation?.product;
  const { item: productOrder, states: orderQueryStates } = useProductOrder({
    productId,
    courseCode: course.code,
  });

  const order = productOrder as CredentialOrder;
  const canPurchase = !order || order.state === OrderState.PENDING;
  const hasPurchased = (order && order.state === OrderState.VALIDATED) ?? false;

  const hasError = Boolean(productQueryStates.error);
  const isFetching = productQueryStates.fetching || orderQueryStates.fetching;
  const canShowContent = !compact || hasPurchased;

  useEffect(() => {
    if (product && product.type !== ProductType.CREDENTIAL) {
      handle(
        new Error(
          `Cannot render product "${product.type}" (${product.id}) through CourseProductItem on course ${course.code}`,
        ),
      );
    }
  }, [product]);

  if (product && product.type !== ProductType.CREDENTIAL) {
    // CourseProductItem only handle CREDENTIAL products
    return null;
  }

  const orderGroups = courseProductRelation
    ? ProductHelper.getActiveOrderGroups(courseProductRelation)
    : [];
  const orderGroupsAvailable = orderGroups.filter(
    (orderGroup) => orderGroup.nb_available_seats > 0,
  );

  return (
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
          {productQueryStates.error}
        </p>
      )}
      {!hasError && product && (
        <>
          <Header
            product={product}
            order={order}
            canPurchase={canPurchase}
            hasPurchased={hasPurchased}
            compact={compact}
          />
          {canShowContent && <Content product={product} order={order} />}
          <footer className="product-widget__footer">
            <CourseProductItemFooter
              course={course}
              product={product as CredentialProduct}
              orderGroups={orderGroups}
              orderGroupsAvailable={orderGroupsAvailable}
              canPurchase={canPurchase}
            />
          </footer>
        </>
      )}
    </section>
  );
};

export default CourseProductItem;
