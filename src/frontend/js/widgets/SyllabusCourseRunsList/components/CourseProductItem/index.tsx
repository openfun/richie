import { Children, useEffect, useMemo } from 'react';
import { defineMessages, FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import c from 'classnames';
import { CourseProductRelation, CredentialOrder, Product, ProductType } from 'types/Joanie';
import { useCourseProduct } from 'hooks/useCourseProducts';
import { Spinner } from 'components/Spinner';
import { Icon, IconTypeEnum } from 'components/Icon';
import { Maybe } from 'types/utils';
import useDateFormat from 'hooks/useDateFormat';
import { ProductHelper } from 'utils/ProductHelper';
import useProductOrder from 'hooks/useProductOrder';
import { OrderHelper } from 'utils/OrderHelper';
import { handle } from 'utils/errors/handle';
import { PacedCourse } from 'types';
import CertificateItem from './components/CourseProductCertificateItem';
import CourseRunItem from './components/CourseRunItem';
import CourseProductItemFooter from './CourseProductItemFooter';

const messages = defineMessages({
  purchased: {
    defaultMessage: 'Purchased',
    description: 'Message displayed when authenticated user owned the product',
    id: 'components.CourseProductItem.purchased',
  },
  loading: {
    defaultMessage: 'Loading product information...',
    description:
      'Accessible text for the initial loading spinner displayed when product is fetching',
    id: 'components.CourseProductItem.loadingInitial',
  },
  fromTo: {
    defaultMessage: 'From {from} {to, select, undefined {} other {to {to}}}',
    description: 'Course run date range',
    id: 'components.CourseProductItem.fromTo',
  },
  availableIn: {
    defaultMessage: 'Available in {languages}',
    description: 'Course run languages',
    id: 'components.CourseProductItem.availableIn',
  },
  original_price: {
    defaultMessage: 'Original price:',
    description: 'Label for the original price of a product',
    id: 'components.CourseProductItem.original_price',
  },
  discounted_price: {
    defaultMessage: 'Discounted price:',
    description: 'Label for the discounted price of a product',
    id: 'components.CourseProductItem.discounted_price',
  },
  discount_rate: {
    defaultMessage: '-{rate}%',
    description: 'Discount rate information',
    id: 'components.CourseProductItem.discount_rate',
  },
  from: {
    defaultMessage: 'from {from}',
    description: 'Discount start date information',
    id: 'components.CourseProductItem.from',
  },
  to: {
    defaultMessage: 'to {to}',
    description: 'Discount end date information',
    id: 'components.CourseProductItem.to',
  },
});

export interface CourseProductItemProps {
  compact?: boolean;
  course: PacedCourse;
  productId: Product['id'];
}

type HeaderProps = {
  compact: boolean;
  hasPurchased: boolean;
  canPurchase: boolean;
  order: Maybe<CredentialOrder>;
  product: Product;
  courseProductRelation: CourseProductRelation;
};
const Header = ({
  product,
  order,
  courseProductRelation,
  hasPurchased,
  canPurchase,
  compact,
}: HeaderProps) => {
  const intl = useIntl();
  const formatDate = useDateFormat();

  // compact mode is available for product until they got an active order.
  const canShowMetadata = useMemo(() => {
    return compact && (!order || canPurchase);
  }, [compact, hasPurchased, canPurchase]);

  const [minDate, maxDate] = useMemo(() => {
    if (!canShowMetadata) return [undefined, undefined];
    return ProductHelper.getDateRange(product);
  }, [canShowMetadata, product]);

  const languages = useMemo(() => {
    if (!canShowMetadata) return '';
    return ProductHelper.getLanguages(product, true, intl);
  }, [canShowMetadata, product, intl]);

  const displayPrice = useMemo(() => {
    if (!canPurchase) {
      return null;
    }

    if (courseProductRelation.discounted_price) {
      return (
        <>
          <span id="original-price" className="offscreen">
            <FormattedMessage {...messages.original_price} />
          </span>
          <del aria-describedby="original-price" className="product-widget__price-discounted">
            <FormattedNumber
              currency={product.price_currency}
              value={product.price}
              style="currency"
            />
          </del>
          <span id="discount-price" className="offscreen">
            <FormattedMessage {...messages.discounted_price} />
          </span>
          <ins aria-describedby="discount-price" className="product-widget__price-discount">
            <FormattedNumber
              currency={product.price_currency}
              value={courseProductRelation.discounted_price}
              style="currency"
            />
          </ins>
        </>
      );
    }

    return (
      <FormattedNumber currency={product.price_currency} value={product.price} style="currency" />
    );
  }, [canPurchase, courseProductRelation.discounted_price, product.price]);

  return (
    <header className="product-widget__header">
      <div className="product-widget__header-main">
        <h3 className="product-widget__title">{product.title}</h3>
      </div>
      <strong className="product-widget__price h6">
        {hasPurchased && <FormattedMessage {...messages.purchased} />}
        {displayPrice}
      </strong>
      {courseProductRelation?.description && (
        <p className="product-widget__header-description">{courseProductRelation.description}</p>
      )}
      {courseProductRelation?.discounted_price && (
        <p className="product-widget__header-discount">
          {courseProductRelation.discount_rate ? (
            <span className="product-widget__header-discount-rate">
              <FormattedNumber value={-courseProductRelation.discount_rate} style="percent" />
            </span>
          ) : (
            <span className="product-widget__header-discount-amount">
              <FormattedNumber
                currency={product.price_currency}
                value={-courseProductRelation.discount_amount!}
                style="currency"
              />
            </span>
          )}
          {courseProductRelation.discount_start && (
            <span className="product-widget__header-discount-date">
              &nbsp;
              <FormattedMessage
                {...messages.from}
                values={{ from: formatDate(courseProductRelation.discount_start) }}
              />
            </span>
          )}
          {courseProductRelation.discount_end && (
            <span className="product-widget__header-discount-date">
              &nbsp;
              <FormattedMessage
                {...messages.to}
                values={{ to: formatDate(courseProductRelation.discount_end) }}
              />
            </span>
          )}
        </p>
      )}
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
                to: formatDate(maxDate),
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
          <CourseRunItem key={target_course.code} targetCourse={target_course} order={order} />
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
  const canPurchase = OrderHelper.isPurchasable(order);
  const hasPurchased = OrderHelper.isActive(order);
  const canEnroll = OrderHelper.allowEnrollment(order);

  const hasError = Boolean(productQueryStates.error);
  const isFetching = productQueryStates.fetching || orderQueryStates.fetching;
  const canShowContent = !compact || canEnroll;

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
            courseProductRelation={courseProductRelation}
            canPurchase={canPurchase}
            hasPurchased={hasPurchased}
            compact={compact}
          />
          {canShowContent && <Content product={product} order={order} />}
          <footer className="product-widget__footer">
            <CourseProductItemFooter
              course={course}
              courseProductRelation={courseProductRelation}
              canPurchase={canPurchase}
            />
          </footer>
        </>
      )}
    </section>
  );
};

export default CourseProductItem;
