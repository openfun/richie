import { useMemo } from 'react';
import { TargetCourse } from 'types/Joanie';
import { Priority } from 'types';
import { Icon, IconTypeEnum } from 'components/Icon';
import CourseRunsList from './CourseRunsList';

type Props = {
  course: TargetCourse;
};

const TargetCourseDetail = ({ course }: Props) => {
  const openedCourseRun = useMemo(() => {
    return course.course_runs.filter(
      (courseRun) => courseRun.state.priority <= Priority.FUTURE_NOT_YET_OPEN,
    );
  }, [course]);

  return (
    <details
      className="product-detail-row__details"
      data-testid={`target-course-detail-${course.code}`}
    >
      <summary className="product-detail-row__summary h4">
        {course.title}
        <Icon name={IconTypeEnum.CHEVRON_DOWN_OUTLINE} />
      </summary>
      <CourseRunsList courseRuns={openedCourseRun} />
    </details>
  );
};

export default TargetCourseDetail;
