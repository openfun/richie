import { defineMessages, FormattedMessage } from 'react-intl';
import { Spinner } from 'components/Spinner';
import { useCourseCode } from 'data/CourseCodeProvider';
import { useCourse } from 'hooks/useCourse';
import { useEnrollment } from 'hooks/useEnrollment';
import type * as Joanie from 'types/Joanie';
import useDateFormat from 'utils/useDateFormat';
import CourseRunSection from './CourseRunSection';

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
      course_run: enrollment.resource_link,
      is_active: false,
      id: enrollment!.id,
    });
    course.methods.invalidate();
  };

  return (
    <CourseRunSection>
      <ol className="course-runs-list">
        <li className="course-runs-item course-runs-item--enrolled">
          <em
            data-testid={`enrollment-${enrollment.id}-start-date`}
            className="course-runs-item__date course-runs-item__date--start"
          >
            {formatDate(enrollment.start)}
          </em>
          <span className="course-runs-item__date-separator" />
          <em
            data-testid={`enrollment-${enrollment.id}-end-date`}
            className="course-runs-item__date course-runs-item__date--end"
          >
            {formatDate(enrollment.end)}
          </em>
        </li>
        <li className="course-runs-item">
          <a
            href={enrollment.resource_link}
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
        </li>
      </ol>
    </CourseRunSection>
  );
};

export default EnrolledCourseRun;
