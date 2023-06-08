import { FormattedMessage, defineMessages } from 'react-intl';
import { DashboardCard } from 'widgets/Dashboard/components/DashboardCard';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading classrooms ...',
    description: 'Message displayed while loading a classrooms',
    id: 'components.TeacherCourseClassroomsDashboardLoader.StudentsSection.loading',
  },
  teacherListTitle: {
    defaultMessage: 'Educational team',
    description: 'Message displayed in classrooms page as teacher section title',
    id: 'components.TeacherCourseClassroomsDashboardLoader.teacherListTitle',
  },
});

const StudentsSection = () => {
  return (
    <DashboardCard
      header={
        <div className="teacher-course-page__course-title__container-small">
          <h2 className="dashboard__title-h1 teacher-course-page__course-title ">
            <FormattedMessage {...messages.teacherListTitle} />
          </h2>
        </div>
      }
      expandable={false}
    />
  );
};
export default StudentsSection;
