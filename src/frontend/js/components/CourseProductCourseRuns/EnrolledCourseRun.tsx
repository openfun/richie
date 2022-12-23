import { defineMessages, FormattedMessage } from 'react-intl';
import { Spinner } from 'components/Spinner';
import { useCourseCode } from 'data/CourseCodeProvider';
import { useCourse } from 'hooks/useCourse';
import { useEnrollment } from 'hooks/useEnrollment';
import type * as Joanie from 'types/Joanie';
import useDateFormat from 'utils/useDateFormat';
import CourseRunSection, { messages as sectionMessages } from './CourseRunSection';

const messages = defineMessages({
  goToCourse: {
    defaultMessage: 'Go to course',
    description: 'CTA displayed when user is enrolled to the course run.',
    id: 'components.EnrolledCourseRun.goToCourse',
  },
  unroll: {
    defaultMessage: 'Unroll',
    description: 'Button label to unroll.',
    id: 'components.EnrolledCourseRun.unroll',
  },
  unrolling: {
    defaultMessage: 'Unrolling...',
    description: 'Accessible label displayed when user is being unrolled.',
    id: 'components.EnrolledCourseRun.unrolling',
  },
});

interface Props {
  enrollment: Joanie.Enrollment;
}

const EnrolledCourseRun = ({ enrollment }: Props) => {
  const formatDate = useDateFormat();
  const { methods, states } = useEnrollment();
  const courseCode = useCourseCode();
  const course = useCourse(courseCode);

  const unroll = async () => {
    await methods.update({
      course_run: enrollment.course_run.id,
      is_active: false,
      id: enrollment!.id,
      was_created_by_order: enrollment.was_created_by_order,
    });
    course.methods.invalidate();
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
        <div className="course-runs-item">
          <a
            href={enrollment.course_run.resource_link}
            className="course-runs-item__cta button--primary button--pill button--tiny"
          >
            <FormattedMessage {...messages.goToCourse} />
          </a>
          <button className="button--tiny" onClick={unroll}>
            {states.updating ? (
              <Spinner aria-labelledby={`unrolling-${enrollment.id}`}>
                <span id={`unrolling-${enrollment.id}`}>
                  <FormattedMessage {...messages.unrolling} />
                </span>
              </Spinner>
            ) : (
              <FormattedMessage {...messages.unroll} />
            )}
          </button>
        </div>
      </div>
    </CourseRunSection>
  );
};

export default EnrolledCourseRun;
