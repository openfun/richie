import { IntlShape } from 'react-intl';
import { CourseProductRelation, Product, TargetCourse } from 'types/Joanie';
import { Maybe } from 'types/utils';
import { IntlHelper } from 'utils/IntlHelper';
import * as Joanie from 'types/Joanie';
import { isOpenedCourseRunCertificate, isOpenedCourseRunCredential } from 'utils/CourseRuns';

/**
 * Helper class for products
 *
 * It provides following util methods :
 * - getDateRange: Return the product date range processed from course runs dates
 * - getLanguages: Return the product languages from course runs, optionally humanized
 */
export class ProductHelper {
  // Private methods
  static #getFlatTargetCourseRuns = (product: Product) => {
    return product.target_courses.flatMap((course: TargetCourse) => course.course_runs);
  };

  // Public methods
  static getDateRange(product: Product) {
    const courseRuns = this.#getFlatTargetCourseRuns(product);

    const minRawDate = Math.min(...courseRuns.map(({ start }) => new Date(start).getTime()));
    const maxRawDate = Math.max(...courseRuns.map(({ end }) => new Date(end).getTime()));

    const minDate = Number.isNaN(minRawDate) ? undefined : new Date(minRawDate);
    const maxDate = Number.isNaN(maxRawDate) ? undefined : new Date(maxRawDate);

    return [minDate, maxDate];
  }

  static getLanguages(product: Product, humanized?: false): string[];
  static getLanguages(product: Product, humanized: true, intl: IntlShape): string;
  static getLanguages(product: Product, humanized = false, intl: Maybe<IntlShape> = undefined) {
    const courseRuns = this.#getFlatTargetCourseRuns(product);
    const languages = courseRuns.flatMap((courseRun) => courseRun.languages);

    const uniqueLanguages = [...new Set(languages)];

    if (!humanized || !intl) return uniqueLanguages;

    return IntlHelper.getLocalizedLanguages(uniqueLanguages, intl);
  }

  static getActiveOrderGroups(courseProductRelation: CourseProductRelation) {
    return courseProductRelation.order_groups?.filter((orderGroup) => orderGroup.is_active);
  }

  static hasRemainingSeats(product: Maybe<Product>) {
    if (!product) return false;
    return typeof product?.remaining_order_count !== 'number' || product.remaining_order_count > 0;
  }

  static hasOpenedTargetCourse(product: Maybe<Product>, enrollment?: Maybe<Joanie.Enrollment>) {
    if (!product) return false;

    if (product.type === Joanie.ProductType.CERTIFICATE) {
      if (!enrollment?.course_run) {
        throw new Error(
          'Unable to check if the certificate product relies on an opened course run without enrollment.',
        );
      }

      return isOpenedCourseRunCertificate(enrollment.course_run.state);
    }

    return (
      product.target_courses.length > 0 &&
      product.target_courses.every(({ course_runs }) =>
        course_runs.some((targetCourseRun) => isOpenedCourseRunCredential(targetCourseRun.state)),
      )
    );
  }

  static isPurchasable(product: Maybe<Product>, enrollment?: Maybe<Joanie.Enrollment>) {
    return this.hasOpenedTargetCourse(product, enrollment) && this.hasRemainingSeats(product);
  }
}
