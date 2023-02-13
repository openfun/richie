import { defineMessages, FormattedMessage } from 'react-intl';
import { useMemo } from 'react';
import { Spinner } from 'components/Spinner';
import { useEnrollments } from 'hooks/useEnrollments';
import type * as Joanie from 'types/Joanie';
import useDateFormat from 'utils/useDateFormat';
import useDateRelative from '../../utils/useDateRelative';
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
  const { methods, states } = useEnrollments();
  const relativeStartDate = useDateRelative(new Date(enrollment.course_run.start));

  const isStarded = useMemo(() => {
    const startDateTime = new Date(enrollment.course_run.start);
    const today = new Date();
    return startDateTime <= today;
  }, [enrollment]);

  const unenroll = () => {
    methods.update({
      course_run: enrollment.course_run.id,
      is_active: false,
      id: enrollment!.id,
      was_created_by_order: enrollment.was_created_by_order,
    });
  };

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
            <a
              href={enrollment.course_run.resource_link}
              className="course-runs-item__cta button--primary button--pill button--tiny"
            >
              <FormattedMessage {...messages.goToCourse} />
            </a>
          )}

          {!isStarded && (
            <p className="course-runs-item__enrolled button--primary button--pill button--tiny disabled">
              <FormattedMessage {...messages.isEnroll} />
            </p>
          )}

          <button className="button--tiny" onClick={unenroll}>
            {states.updating ? (
              <Spinner aria-labelledby={`unrolling-${enrollment.id}`}>
                <span id={`unrolling-${enrollment.id}`}>
                  <FormattedMessage {...messages.unenrolling} />
                </span>
              </Spinner>
            ) : (
              <FormattedMessage {...messages.unenroll} />
            )}
          </button>
        </div>
      </div>
    </CourseRunSection>
  );
};

export default EnrolledCourseRun;
