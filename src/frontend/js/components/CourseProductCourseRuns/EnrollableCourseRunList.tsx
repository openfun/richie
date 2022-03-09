import { Children, type ReactEventHandler, useMemo, useRef, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Icon } from 'components/Icon';
import { Spinner } from 'components/Spinner';
import { useCourseCode } from 'data/CourseCodeProvider';
import { useEnrollment } from 'hooks/useEnrollment';
import { useCourse } from 'hooks/useCourse';
import { Priority } from 'types';
import type * as Joanie from 'types/Joanie';
import type { Maybe } from 'types/utils';
import useDateFormat from 'utils/useDateFormat';
import CourseRunSection from './CourseRunSection';

const messages = defineMessages({
  ariaSelectCourseRun: {
    defaultMessage: 'Select course run from {start} to {end}.',
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
  enrollOn: {
    defaultMessage: 'Enrollment from {enrollment_start} to {enrollment_end}',
    description: 'Text label for the enrollment dates',
    id: 'components.EnrollableCourseRunList.enrollOn',
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
  order: Joanie.OrderLite;
}

const EnrollableCourseRunList = ({ courseRuns, order }: Props) => {
  const intl = useIntl();
  const formatDate = useDateFormat();
  const formRef = useRef<HTMLFormElement>(null);

  const [selectedCourseRun, setSelectedCourseRun] = useState<Maybe<Joanie.CourseRun>>();
  const selectedCourseRunIsNotOpened = useMemo(
    () =>
      selectedCourseRun === undefined ||
      selectedCourseRun.state.priority >= Priority.FUTURE_NOT_YET_OPEN,
    [selectedCourseRun],
  );

  const enrollment = useEnrollment();
  const courseCode = useCourseCode();
  const course = useCourse(courseCode);

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
    const courseRun = courseRuns.find(({ resource_link }) => resource_link === courseRunId);
    setSelectedCourseRun(courseRun);
  };

  const handleEnroll: ReactEventHandler<HTMLButtonElement> = async (event) => {
    event.preventDefault();
    if (selectedCourseRun) {
      const relatedEnrollment = order.enrollments.find(({ resource_link }) => {
        return resource_link === selectedCourseRun.resource_link;
      });
      if (relatedEnrollment) {
        await enrollment.methods.update({
          is_active: true,
          course_run: selectedCourseRun.resource_link,
          id: relatedEnrollment.id,
        });
      } else {
        await enrollment.methods.create({
          is_active: true,
          order: order.id,
          course_run: selectedCourseRun.resource_link,
        });
      }
      course.methods.invalidate();
    }
  };

  if (courseRuns.length === 0) {
    return (
      <p className="course-runs-not-available product-widget__item-description">
        <Icon name="icon-warning" />
        <FormattedMessage {...messages.noCourseRunAvailable} />
      </p>
    );
  }

  return (
    <CourseRunSection>
      <form ref={formRef} onChange={handleChange}>
        <ol className="course-runs-list">
          {Children.toArray(
            courseRuns.map((courseRun) => (
              <li className="course-runs-item form-field">
                <input
                  className="form-field__radio-input"
                  type="radio"
                  id={`${order.id}|${courseRun.resource_link}`}
                  name={order.id}
                  aria-label={intl.formatMessage(messages.ariaSelectCourseRun, {
                    start: formatDate(courseRun.start),
                    end: formatDate(courseRun.end),
                  })}
                />
                <label
                  className="form-field__label"
                  htmlFor={`${order.id}|${courseRun.resource_link}`}
                >
                  <span className="form-field__radio-control" />
                  <strong className="course-runs-item__course-dates">
                    <em
                      data-testid={`course-run-${courseRun.id}-start-date`}
                      className="course-runs-item__date course-runs-item__date--start"
                    >
                      {formatDate(courseRun.start)}
                    </em>
                    <span className="course-runs-item__date-separator" />
                    <em
                      data-testid={`course-run-${courseRun.id}-end-date`}
                      className="course-runs-item__date course-runs-item__date--end"
                    >
                      {formatDate(courseRun.end)}
                    </em>
                  </strong>
                  <span
                    data-testid={`course-run-${courseRun.id}-enrollment-dates`}
                    className="course-runs-item__enrollment-dates"
                  >
                    <FormattedMessage
                      {...messages.enrollOn}
                      values={{
                        enrollment_start: formatDate(courseRun.enrollment_start),
                        enrollment_end: formatDate(courseRun.enrollment_end),
                      }}
                    />
                  </span>
                </label>
              </li>
            )),
          )}
          <li className="course-runs-item">
            <button
              className="course-runs-item__cta button--primary button--pill button--tiny"
              onClick={handleEnroll}
              disabled={selectedCourseRunIsNotOpened}
            >
              {enrollment.states.creating || enrollment.states.updating ? (
                <Spinner theme="light" aria-labelledby="enrolling">
                  <span id="enrolling">
                    <FormattedMessage {...messages.enrolling} />
                  </span>
                </Spinner>
              ) : !selectedCourseRun ? (
                <FormattedMessage {...messages.selectCourseRun} />
              ) : selectedCourseRun.state.priority >= Priority.FUTURE_NOT_YET_OPEN ? (
                <FormattedMessage
                  {...messages.enrollmentNotYetOpened}
                  values={{ enrollment_start: formatDate(selectedCourseRun.enrollment_start) }}
                />
              ) : (
                <FormattedMessage {...messages.enroll} />
              )}
            </button>
          </li>
        </ol>
      </form>
    </CourseRunSection>
  );
};

export default EnrollableCourseRunList;
