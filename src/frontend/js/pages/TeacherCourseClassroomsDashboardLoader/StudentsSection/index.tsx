import { FormattedMessage, defineMessages } from 'react-intl';
import { DashboardCard } from 'widgets/Dashboard/components/DashboardCard';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading classrooms ...',
    description: 'Message displayed while loading a classrooms',
    id: 'components.TeacherCourseClassroomsDashboardLoader.TeachersSection.loading',
  },
  studentsListTitle: {
    defaultMessage: 'Learners registered for training',
    description: 'Message displayed in classrooms page as students section title',
    id: 'components.TeacherCourseClassroomsDashboardLoader.TeachersSection.studentsListTitle',
  },
});

const StudentsSection = () => {
  return (
    <DashboardCard
      header={
        <div className="teacher-course-page__course-title__container-small">
          <h2 className="dashboard__title-h1 teacher-course-page__course-title ">
            <FormattedMessage {...messages.studentsListTitle} />
          </h2>
        </div>
      }
      expandable={false}
    />
  );
};
export default StudentsSection;
