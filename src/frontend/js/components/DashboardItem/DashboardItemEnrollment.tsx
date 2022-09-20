import { DashboardItemEnrollmentFooter } from 'components/DashboardItem/DashboardItemEnrollmentFooter';
import { Enrollment } from 'types/Joanie';
import { DashboardItem, DEMO_IMAGE_URL } from './index';

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
      imageUrl={DEMO_IMAGE_URL}
      footer={<DashboardItemEnrollmentFooter enrollment={enrollment} />}
    />
  );
};
