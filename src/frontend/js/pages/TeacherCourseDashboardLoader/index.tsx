import { FormattedMessage, defineMessages } from 'react-intl';
import { useParams } from 'react-router-dom';

import { capitalize } from 'lodash-es';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherCourseDashboardSidebar } from 'widgets/Dashboard/components/TeacherCourseDashboardSidebar';
import { useCourse } from 'hooks/useCourses';
import { Spinner } from 'components/Spinner';
import { DashboardCard } from 'widgets/Dashboard/components/DashboardCard';
import { Icon, IconTypeEnum } from 'components/Icon';
import CourseRunList from './CourseRunList';

const messages = defineMessages({
  courses: {
    defaultMessage: 'Your courses',
    description: 'Filtered courses title',
    id: 'components.TeacherCourseDashboardLoader.title.filteredCourses',
  },
  incoming: {
    defaultMessage: 'Incoming',
    description: 'Incoming courses title',
    id: 'components.TeacherCourseDashboardLoader.title.incoming',
  },
  ongoing: {
    defaultMessage: 'Ongoing',
    description: 'Ongoing courses title',
    id: 'components.TeacherCourseDashboardLoader.title.ongoing',
  },
  archived: {
    defaultMessage: 'Archived',
    description: 'Archived courses title',
    id: 'components.TeacherCourseDashboardLoader.title.archived',
  },
  loading: {
    defaultMessage: 'Loading course...',
    description: 'Message displayed while loading a course',
    id: 'components.TeacherCourseDashboardLoader.loading',
  },
});

export const TeacherCourseDashboardLoader = () => {
  const { courseCode } = useParams<{ courseCode: string }>();
  const {
    item: course,
    states: { fetching },
  } = useCourse(courseCode!);

  return (
    <DashboardLayout sidebar={<TeacherCourseDashboardSidebar />}>
      {fetching ? (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      ) : (
        <div className="teacher-course-page">
          <DashboardCard
            className="icon-arrow-right-rounded"
            header={
              <div className="teacher-course-page__course-title__container">
                <h2 className="teacher-course-page__course-title dashboard__title-h2">
                  <Icon name={IconTypeEnum.ARROW_RIGHT_ROUNDED} />
                  <span className="teacher-course-page__course-title__text">
                    {capitalize(course.title)}
                  </span>
                </h2>
              </div>
            }
            expandable={false}
            fullWidth
          >
            <CourseRunList courseCode={course.code} courseRuns={course.course_runs} />
          </DashboardCard>
        </div>
      )}
    </DashboardLayout>
  );
};
