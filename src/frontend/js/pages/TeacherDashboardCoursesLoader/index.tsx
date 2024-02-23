import { FormattedMessage, defineMessages, useIntl } from 'react-intl';

import TeacherDashboardCourseList from 'components/TeacherDashboardCourseList';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherDashboardProfileSidebar } from 'widgets/Dashboard/components/TeacherDashboardProfileSidebar';

const messages = defineMessages({
  courses: {
    defaultMessage: 'Your courses',
    description: 'Filtered courses title',
    id: 'components.TeacherDashboardCoursesLoader.title.filteredCourses',
  },
  incoming: {
    defaultMessage: 'Incoming',
    description: 'Incoming courses title',
    id: 'components.TeacherDashboardCoursesLoader.title.incoming',
  },
  ongoing: {
    defaultMessage: 'Ongoing',
    description: 'Ongoing courses title',
    id: 'components.TeacherDashboardCoursesLoader.title.ongoing',
  },
  archived: {
    defaultMessage: 'Archived',
    description: 'Archived courses title',
    id: 'components.TeacherDashboardCoursesLoader.title.archived',
  },
});

export const TeacherDashboardCoursesLoader = () => {
  return (
    <DashboardLayout sidebar={<TeacherDashboardProfileSidebar />}>
      <div className="dashboard__page_title_container">
        <h1 className="dashboard__page_title">
          <FormattedMessage {...messages.courses} />
        </h1>
      </div>
      <div className="teacher-courses-page">
        <TeacherDashboardCourseList />
      </div>
    </DashboardLayout>
  );
};
