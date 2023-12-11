import { defineMessages, FormattedMessage } from 'react-intl';
import { useMemo } from 'react';
import { Button } from '@openfun/cunningham-react';
import { useEnrollments } from 'hooks/useEnrollments';
import type * as Joanie from 'types/Joanie';
import useDateFormat from 'hooks/useDateFormat';
import useDateRelative from 'hooks/useDateRelative';
import CourseRunSection, { messages as sectionMessages } from './CourseRunSection';

const messages = defineMessages({
  goToCourse: {
    defaultMessage: 'Go to course',
    description: 'CTA displayed when user is enrolled to the course run.',
    id: 'components.EnrolledCourseRun.goToCourse',
  },
  isEnroll: {
    defaultMessage: 'You are enrolled',
    description: 'Message displayed when user is enrolled but the course run is not started',
    id: 'components.EnrolledCourseRun.isEnroll',
  },
  courseRunStartIn: {
    defaultMessage: 'The course starts {relativeStartDate}',
    description: 'Error displayed when user is enrolled but the course run is not started',
    id: 'components.EnrolledCourseRun.courseRunStartIn',
  },
  unenroll: {
    defaultMessage: 'Unenroll',
    description: 'Button label to unenroll.',
    id: 'components.EnrolledCourseRun.unenroll',
  },
  unenrolling: {
    defaultMessage: 'Unenrolling...',
    description: 'Accessible label displayed when user is being unenrolled.',
    id: 'components.EnrolledCourseRun.unenrolling',
  },
});

interface Props {
  enrollment: Joanie.Enrollment;
}

const EnrolledCourseRun = ({ enrollment }: Props) => {
  const formatDate = useDateFormat();
  const { states } = useEnrollments();
  const relativeStartDate = useDateRelative(new Date(enrollment.course_run.start));

  const isStarded = useMemo(() => {
    const startDateTime = new Date(enrollment.course_run.start);
    const today = new Date();
    return startDateTime <= today;
  }, [enrollment]);

  return (
    <CourseRunSection>
      <div className="course-runs-list">
        <div className="course-runs-item course-runs-item--enrolled">
          <span
            className="offscreen"
            data-testid={`enrollment-${enrollment.id}-offscreen-start-date`}
          >
            <FormattedMessage {...sectionMessages.start} />
          </span>
          <em
            data-testid={`enrollment-${enrollment.id}-start-date`}
            className="course-runs-item__date course-runs-item__date--start"
          >
            {formatDate(enrollment.course_run.start)}
          </em>
          <span className="course-runs-item__date-separator" />
          <span
            className="offscreen"
            data-testid={`enrollment-${enrollment.id}-offscreen-end-date`}
          >
            <FormattedMessage {...sectionMessages.end} />
          </span>
          <em
            data-testid={`enrollment-${enrollment.id}-end-date`}
            className="course-runs-item__date course-runs-item__date--end"
          >
            {formatDate(enrollment.course_run.end)}
          </em>
        </div>
        {states.error && <p className="course-runs-list__errors-feedback ">{states.error}</p>}

        {!isStarded && (
          <p className="course-runs-list__errors-feedback ">
            <FormattedMessage {...messages.courseRunStartIn} values={{ relativeStartDate }} />
          </p>
        )}
        <div className="course-runs-item">
          {isStarded && (
            <Button
              size="small"
              href={enrollment.course_run.resource_link}
              className="course-runs-item__cta"
            >
              <FormattedMessage {...messages.goToCourse} />
            </Button>
          )}

          {!isStarded && (
            <p className="course-runs-item__enrolled button--primary button--pill button--tiny disabled">
              <FormattedMessage {...messages.isEnroll} />
            </p>
          )}
        </div>
      </div>
    </CourseRunSection>
  );
};

export default EnrolledCourseRun;
