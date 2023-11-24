import { useEffect, useRef } from 'react';
import { defineMessages } from 'react-intl';
import { Priority } from 'types';
import type * as Joanie from 'types/Joanie';
import { OrderState, Product } from 'types/Joanie';
import { CoursesHelper } from 'utils/CoursesHelper';
import {
  CourseRunList,
  EnrollableCourseRunList,
  EnrolledCourseRun,
} from '../CourseProductCourseRuns';

export const messages = defineMessages({
  language: {
    defaultMessage: `{
count,
plural,
one {Language:}
other {Languages:}
}`,
    description: 'Label displayed before the list of languages',
    id: 'components.SaleTunnelStepValidation.language',
  },
});

interface Props {
  targetCourse: Joanie.TargetCourse;
  order?: Joanie.CredentialOrder;
  product: Product;
}

const CourseRunItem = ({ targetCourse, order, product }: Props) => {
  const isEnrollable = order?.state === OrderState.VALIDATED;
  const courseRunEnrollment = isEnrollable
    ? CoursesHelper.findActiveCourseEnrollmentInOrder(targetCourse, order)
    : undefined;
  const isEnrolled = !!courseRunEnrollment?.is_active;

  const isOpenedCourseRun = (courseRun: Joanie.CourseRun) =>
    courseRun.state.priority <= Priority.FUTURE_NOT_YET_OPEN;

  const containerRef = useRef<HTMLLIElement>(null);
  /**
   * we make sure that keyboard/screen reader users don't get lost when clicking
   * the "enroll" or "unroll" buttons. Since these buttons get removed from the DOM
   * after clicking on them, by default the browser then focuses the <body> tag.
   * We prefer to stay in the current context and focus the new button replacing the one
   * we just clicked.
   */
  useEffect(() => {
    const observer = new MutationObserver((mutationsList) => {
      /**
       * when the user clicked "enroll" or "unroll", this function is called with
       * two mutations in mutationsList: one for the removal of a CourseRunSection,
       * one for the addition of a CourseRunSection
       * (corresponding to the EnrollableCourseRunList and EnrolledCourseRun components).
       *
       * We can assume the only case where our big test passes is when the user
       * clicked "enroll" or "unroll".
       */
      const justClickedCTA =
        mutationsList.length === 2 &&
        mutationsList[0].removedNodes.length === 1 &&
        mutationsList[1].addedNodes.length === 1 &&
        mutationsList.filter((m) => m.target === containerRef.current).length === 2;
      if (justClickedCTA) {
        containerRef.current?.querySelector<HTMLElement>('.course-runs-item__cta')?.focus();
      }
    });
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        attributes: false,
      });
    }

    return () => {
      observer.disconnect();
    };
  }, []);
  return (
    <li
      data-testid={`course-item-${targetCourse.code}`}
      tabIndex={-1}
      ref={containerRef}
      className="product-widget__item course"
    >
      <strong className="product-widget__item-title h5">{targetCourse.title}</strong>
      {!isEnrollable && (
        <CourseRunList courseRuns={targetCourse.course_runs.filter(isOpenedCourseRun)} />
      )}
      {isEnrollable && !isEnrolled && (
        <EnrollableCourseRunList
          courseRuns={targetCourse.course_runs.filter(isOpenedCourseRun)}
          order={order}
          product={product}
        />
      )}
      {isEnrollable && isEnrolled && <EnrolledCourseRun enrollment={courseRunEnrollment} />}
    </li>
  );
};

export default CourseRunItem;
