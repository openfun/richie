import { Enrollment } from 'types/Joanie';
import { DashboardItemCourseEnrolling } from '../DashboardItemCourseEnrolling';
import { DashboardItem } from '..';

interface DashboardItemCourseRunProps {
  enrollment: Enrollment;
}

export const DashboardItemEnrollment = ({ enrollment }: DashboardItemCourseRunProps) => {
  const { course } = enrollment.course_run;
  if (!course) {
    throw new Error("Enrollment's course_run must provide course attribute");
  }

  return (
    <DashboardItem
      title={course.title}
      code={'Ref. ' + course.code}
      footer={
        <DashboardItemCourseEnrolling course={course} activeEnrollment={enrollment} icon={true} />
      }
    />
  );
};
