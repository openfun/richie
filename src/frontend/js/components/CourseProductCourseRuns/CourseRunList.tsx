import { Children } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Icon } from 'components/Icon';
import type * as Joanie from 'types/Joanie';
import useDateFormat from 'utils/useDateFormat';
import CourseRunSection from './CourseRunSection';

const messages = defineMessages({
  enrollFromTo: {
    defaultMessage: 'Enrollment from {start} to {end}',
    description: 'Text label for the enrollment dates',
    id: 'components.CourseRunList.enrollFromTo',
  },
  noCourseRunAvailable: {
    defaultMessage: 'No session available for this course.',
    description: 'Text displayed when no course run are opened for the course',
    id: 'components.CourseRunList.noCourseRunAvailable',
  },
});

interface Props {
  courseRuns: Joanie.CourseRun[];
}

const CourseRunList = ({ courseRuns }: Props) => {
  const formatDate = useDateFormat();

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
      <ol className="course-runs-list">
        {Children.toArray(
          courseRuns.map((courseRun) => (
            <li className="course-runs-item course-runs-item--inactive">
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
                  {...messages.enrollFromTo}
                  values={{
                    start: formatDate(courseRun.enrollment_start),
                    end: formatDate(courseRun.enrollment_end),
                  }}
                />
              </span>
            </li>
          )),
        )}
      </ol>
    </CourseRunSection>
  );
};

export default CourseRunList;
