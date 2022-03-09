import { PropsWithChildren } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import * as Joanie from 'types/Joanie';
import useDateFormat from 'utils/useDateFormat';

const messages = defineMessages({
  availableCourseRuns: {
    defaultMessage: `{
count,
plural,
=0 {No course runs}
one {One course run}
other {# course runs}
} available`,
    description: 'Course runs available text',
    id: 'components.SaleTunnelStepValidation.availableCourseRuns',
  },
  courseRunDates: {
    defaultMessage: 'From {start} to {end}',
    description: 'Course run date text',
    id: 'components.SaleTunnelStepValidation.courseRunDates',
  },
  noCourseRunAvailable: {
    defaultMessage: 'No session available for this course.',
    description: 'Text displayed when no course run are opened for the course',
    id: 'components.CourseProductsLists.noCourseRunAvailable',
  },
  enrollOn: {
    defaultMessage: 'Enrollment from {start} to {end}',
    description: 'Text label for the enrollment dates',
    id: 'components.CourseProductsLists.enrollOn',
  },
});

const CourseRunsList = ({ courseRuns }: PropsWithChildren<{ courseRuns: Joanie.CourseRun[] }>) => {
  const formatDate = useDateFormat({ month: 'long' });

  if (courseRuns.length === 0) {
    return (
      <div className="product-detail-row__content product-detail-row__course-run-dates">
        <p className="product-detail-row__course-run-dates__count">
          <svg role="img" width="24">
            <use href="#icon-warning" />
          </svg>
          <FormattedMessage {...messages.noCourseRunAvailable} />
        </p>
      </div>
    );
  }

  return (
    <div className="product-detail-row__content product-detail-row__course-run-dates">
      <p className="product-detail-row__course-run-dates__count">
        <svg role="img" width="24">
          <use href="#icon-calendar" />
        </svg>
        <FormattedMessage {...messages.availableCourseRuns} values={{ count: courseRuns.length }} />
      </p>
      <ul className="product-detail-row__course-run-dates__list">
        {courseRuns.map((courseRun) => (
          <li className="product-detail-row__course-run-dates__item" key={courseRun.id}>
            <FormattedMessage
              {...messages.courseRunDates}
              values={{
                start: formatDate(courseRun.start),
                end: formatDate(courseRun.end),
              }}
            />
            <span className="course-run__enrollment-dates">
              <FormattedMessage
                {...messages.enrollOn}
                values={{
                  start: formatDate(courseRun.enrollment_start),
                  end: formatDate(courseRun.enrollment_end),
                }}
              />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CourseRunsList;
