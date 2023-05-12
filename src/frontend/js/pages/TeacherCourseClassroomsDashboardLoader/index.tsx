import { FormattedMessage, defineMessages } from 'react-intl';
import { useParams } from 'react-router-dom';

import { useMemo } from 'react';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherCourseDashboardSidebar } from 'widgets/Dashboard/components/TeacherCourseDashboardSidebar';
import { useCourse } from 'hooks/useCourses';
import { Spinner } from 'components/Spinner';
import { CourseRun } from 'types/Joanie';
import CourseRunSection from './CourseRunSection';
import StudentsSection from './StudentsSection';
import TeachersSection from './TeachersSection';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading classrooms ...',
    description: 'Message displayed while loading a classrooms',
    id: 'components.TeacherCourseClassroomsDashboardLoader.loading',
  },
  noCourseRun: {
    defaultMessage: "This course run does't exist",
    description: "Message displayed when requested classroom's course run doesn't exist",
    id: 'components.TeacherCourseClassroomsDashboardLoader.noCourseRun',
  },
});

export const TeacherCourseClassroomsDashboardLoader = () => {
  const { courseCode, courseRunId } = useParams<{ courseCode: string; courseRunId: string }>();
  const {
    item: course,
    states: { fetching },
  } = useCourse(courseCode!);
  const courseRun: CourseRun | undefined = useMemo(
    () => course?.course_runs.find((courseCourseRun) => courseCourseRun.id === courseRunId),
    [course, courseRunId],
  );

  return (
    <DashboardLayout sidebar={<TeacherCourseDashboardSidebar />}>
      {fetching && (
        <Spinner aria-labelledby="loading-teacher-course-classroom-data">
          <span id="loading-teacher-course-classroom-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      )}

      {!fetching && courseRun === undefined && (
        <p>
          <FormattedMessage {...messages.noCourseRun} />
        </p>
      )}

      {!fetching && courseRun !== undefined && (
        <div className="teacher-classroom-page">
          <DashboardLayout.Section>
            <CourseRunSection course={course} courseRun={courseRun} />
          </DashboardLayout.Section>

          <DashboardLayout.Section>
            <StudentsSection />
          </DashboardLayout.Section>

          <DashboardLayout.Section>
            <TeachersSection />
          </DashboardLayout.Section>
        </div>
      )}
    </DashboardLayout>
  );
};
