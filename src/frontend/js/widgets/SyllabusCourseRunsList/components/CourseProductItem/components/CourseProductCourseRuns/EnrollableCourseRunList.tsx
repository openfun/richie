import { Children, type FormEventHandler, useMemo, useRef, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { Icon, IconTypeEnum } from 'components/Icon';
import { Spinner } from 'components/Spinner';
import { useEnrollments } from 'hooks/useEnrollments';
import { Priority } from 'types';
import type * as Joanie from 'types/Joanie';
import type { Maybe } from 'types/utils';
import useDateFormat from 'hooks/useDateFormat';
import { IntlHelper } from 'utils/IntlHelper';
import WebAnalyticsAPIHandler from 'api/web-analytics';
import EnrollmentDate from 'components/EnrollmentDate';
import { Product } from 'types/Joanie';
import { OrderHelper } from 'utils/OrderHelper';
import { messages as sharedMessages } from '../CourseRunItem';
import CourseRunSection, { messages as sectionMessages } from './CourseRunSection';

const messages = defineMessages({
  ariaSelectCourseRun: {
    defaultMessage: 'Select course run from {start} {end, select, undefined {} other {to {end}}}.',
    description:
      'Accessible label used by screen reader when user checked a course run radio input.',
    id: 'components.EnrollableCourseRunList.ariaSelectCourseRun',
  },
  enroll: {
    defaultMessage: 'Enroll',
    description: 'Text label for the enroll button',
    id: 'components.EnrollableCourseRunList.enroll',
  },
  enrolling: {
    defaultMessage: 'Enrolling...',
    description: 'Label displayed when a request to enroll to a course run is loading',
    id: 'components.EnrollableCourseRunList.enrolling',
  },
  enrollmentNotYetOpened: {
    defaultMessage: 'Enrollment will open on {enrollment_start}',
    description: 'Text label for the enroll cta when enrollment is not yet opened',
    id: 'components.EnrollableCourseRunList.enrollmentNotYetOpened',
  },
  noCourseRunAvailable: {
    defaultMessage: 'No session available for this course.',
    description: 'Text displayed when no course run are opened for the course',
    id: 'components.EnrollableCourseRunList.noCourseRunAvailable',
  },
  selectCourseRun: {
    defaultMessage: 'Select a course run',
    description: 'Label displayed when user do not have select a course run.',
    id: 'components.EnrollableCourseRunList.selectCourseRun',
  },
});

interface Props {
  courseRuns: Joanie.CourseRun[];
  order: Joanie.Order;
  product: Product;
}

const EnrollableCourseRunList = ({ courseRuns, order, product }: Props) => {
  const intl = useIntl();
  const formatDate = useDateFormat();
  const formRef = useRef<HTMLFormElement>(null);
  const needsSignature = order
    ? OrderHelper.orderNeedsSignature(order, product.contract_definition)
    : false;

  const [selectedCourseRun, setSelectedCourseRun] = useState<Maybe<Joanie.CourseRun>>();
  const [submitted, setSubmitted] = useState(false);
  const selectedCourseRunIsNotOpened = useMemo(
    () =>
      selectedCourseRun === undefined ||
      selectedCourseRun.state.priority >= Priority.FUTURE_NOT_YET_OPEN,
    [selectedCourseRun],
  );

  const enrollment = useEnrollments();
  const loading = enrollment.states.creating || enrollment.states.updating;
  const canSubmit = selectedCourseRun && !selectedCourseRunIsNotOpened;
  const showFeedback = (!loading && submitted && !canSubmit) || enrollment.states.error;

  const handleChange = () => {
    const form = formRef.current;
    const selectedInput = Array.from(form?.elements || [])
      .filter((element) => element instanceof HTMLInputElement)
      .find((element) => {
        if (element instanceof HTMLInputElement) {
          return !!element?.checked;
        }
        return false;
      });

    const courseRunId = selectedInput?.id.split('|')[1];
    const courseRun = courseRuns.find(({ id }) => id === courseRunId);
    setSelectedCourseRun(courseRun);
  };

  const handleEnroll: FormEventHandler<HTMLFormElement> = async (event) => {
    setSubmitted(true);
    event.preventDefault();

    // focus the feedback element if there are errors
    if (!canSubmit) {
      // we use an attribute selector and not an id selector because the CSS engine
      // doesn't understand id selectors beginning with digits
      formRef.current?.querySelector<HTMLElement>(`[id="${order.id}-feedback"]`)?.focus();
      return;
    }

    if (selectedCourseRun) {
      WebAnalyticsAPIHandler()?.sendEnrolledEvent(selectedCourseRun.resource_link);
      const relatedEnrollment = order.target_enrollments.find(({ course_run }) => {
        return course_run.id === selectedCourseRun.id;
      });
      if (relatedEnrollment) {
        await enrollment.methods.update({
          is_active: true,
          course_run_id: selectedCourseRun.id,
          id: relatedEnrollment.id,
          was_created_by_order: true,
        });
      } else {
        await enrollment.methods.create({
          is_active: true,
          course_run_id: selectedCourseRun.id,
          was_created_by_order: true,
        });
      }
    }
  };

  if (courseRuns.length === 0) {
    return (
      <p className="course-runs-not-available product-widget__item-description">
        <Icon name={IconTypeEnum.WARNING} size="small" />
        <FormattedMessage {...messages.noCourseRunAvailable} />
      </p>
    );
  }

  return (
    <CourseRunSection>
      <form ref={formRef} onChange={handleChange} onSubmit={handleEnroll}>
        <ol className="course-runs-list">
          {Children.toArray(
            courseRuns.map((courseRun) => (
              <li className="course-runs-item form-field">
                <input
                  className="form-field__radio-input"
                  type="radio"
                  id={`${order.id}|${courseRun.id}`}
                  name={order.id}
                  disabled={needsSignature}
                  aria-label={intl.formatMessage(messages.ariaSelectCourseRun, {
                    start: formatDate(courseRun.start),
                    end: formatDate(courseRun.end),
                  })}
                />
                <label className="form-field__label" htmlFor={`${order.id}|${courseRun.id}`}>
                  <span className="form-field__radio-control" />
                  <strong className="course-runs-item__course-dates">
                    <span
                      className="offscreen"
                      data-testid={`course-run-${courseRun.id}-offscreen-start-date`}
                    >
                      <FormattedMessage {...sectionMessages.start} />
                    </span>
                    <em
                      data-testid={`course-run-${courseRun.id}-start-date`}
                      className="course-runs-item__date course-runs-item__date--start"
                    >
                      {formatDate(courseRun.start)}
                    </em>
                    <span className="course-runs-item__date-separator" />
                    <span
                      className="offscreen"
                      data-testid={`course-run-${courseRun.id}-offscreen-end-date`}
                    >
                      <FormattedMessage {...sectionMessages.end} />
                    </span>
                    <em
                      data-testid={`course-run-${courseRun.id}-end-date`}
                      className="course-runs-item__date course-runs-item__date--end"
                    >
                      {formatDate(courseRun.end)}
                    </em>
                  </strong>
                  <span
                    data-testid={`course-run-${courseRun.id}-enrollment-dates`}
                    className="course-runs-item__metadata"
                  >
                    <EnrollmentDate
                      enrollment_start={courseRun.enrollment_start}
                      enrollment_end={courseRun.enrollment_end}
                    />
                  </span>
                  <span
                    data-testid={`course-run-${courseRun.id}-languages`}
                    className="course-runs-item__metadata"
                  >
                    <FormattedMessage
                      {...sharedMessages.language}
                      values={{ count: courseRun.languages.length }}
                    />
                    &nbsp;
                    {IntlHelper.getLocalizedLanguages(courseRun.languages, intl)}
                  </span>
                </label>
              </li>
            )),
          )}
        </ol>
        <div className="course-runs-item course-runs-item--submit">
          <span id={`${order.id}-feedback`} className="course-runs-item__feedback" tabIndex={-1}>
            {showFeedback &&
              (selectedCourseRun ? (
                selectedCourseRunIsNotOpened ? (
                  <FormattedMessage
                    {...messages.enrollmentNotYetOpened}
                    values={{ enrollment_start: formatDate(selectedCourseRun.enrollment_start) }}
                  />
                ) : (
                  enrollment.states?.error
                )
              ) : (
                <FormattedMessage {...messages.selectCourseRun} />
              ))}
          </span>
          <Button size="small" className="course-runs-item__cta" disabled={needsSignature}>
            {loading ? (
              <Spinner theme="light" aria-labelledby="enrolling">
                <span id="enrolling">
                  <FormattedMessage {...messages.enrolling} />
                </span>
              </Spinner>
            ) : (
              <FormattedMessage {...messages.enroll} />
            )}
          </Button>
        </div>
      </form>
    </CourseRunSection>
  );
};

export default EnrollableCourseRunList;
