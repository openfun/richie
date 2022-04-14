import { Children, useCallback } from 'react';
import { defineMessages, FormattedMessage, FormattedNumber } from 'react-intl';
import CertificateItem from 'components/CourseProductCertificateItem';
import {
  CourseRunList,
  EnrollableCourseRunList,
  EnrolledCourseRun,
} from 'components/CourseProductCourseRuns';
import SaleTunnel from 'components/SaleTunnel';
import { Priority } from 'types';
import type * as Joanie from 'types/Joanie';
import PurchasedProductMenu from './PurchasedProductMenu';

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

  const isOpenedCourseRun = (courseRun: Joanie.CourseRun) =>
    courseRun.state.priority <= Priority.FUTURE_NOT_YET_OPEN;

  const getCourseRunEnrollment = useCallback(
    (targetCourse: Joanie.CourseProductTargetCourse) => {
      if (!isOwned) return undefined;

      const resourceLinks = targetCourse.course_runs.map(({ resource_link }) => resource_link);
      return order.enrollments.find(({ is_active, resource_link }) => {
        return is_active && resourceLinks.includes(resource_link);
      });
    },
    [order],
  );

  const isEnrolled = useCallback(
    (targetCourse: Joanie.CourseProductTargetCourse) =>
      !!getCourseRunEnrollment(targetCourse)?.is_active,
    [getCourseRunEnrollment],
  );

  return (
    <section className="product-widget">
      <header className="product-widget__header">
        <h3 className="product-widget__title">{product.title}</h3>
        <h6 className="product-widget__price">
          {isOwned ? (
            <FormattedMessage {...messages.enrolled} />
          ) : (
            <FormattedNumber
              currency={product.price_currency}
              value={product.price}
              style="currency"
            />
          )}
        </h6>
        {isOwned && <PurchasedProductMenu order={order} />}
      </header>
      <ol className="product-widget__content">
        {Children.toArray(
          product.target_courses.map((target_course) => (
            <li
              data-testid={`course-item-${target_course.code}`}
              className="product-widget__item course"
            >
              <h5 className="product-widget__item-title">{target_course.title}</h5>
              {!isOwned && (
                <CourseRunList courseRuns={target_course.course_runs.filter(isOpenedCourseRun)} />
              )}
              {isOwned && !isEnrolled(target_course) && (
                <EnrollableCourseRunList
                  courseRuns={target_course.course_runs.filter(isOpenedCourseRun)}
                  order={order}
                />
              )}
              {isOwned && isEnrolled(target_course) && (
                <EnrolledCourseRun enrollment={getCourseRunEnrollment(target_course)!} />
              )}
            </li>
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
