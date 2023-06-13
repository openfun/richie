import { defineMessages, useIntl } from 'react-intl';

import TeacherDashboardCourseList from 'components/TeacherDashboardCourseList';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherProfileDashboardSidebar } from 'widgets/Dashboard/components/TeacherProfileDashboardSidebar';

const messages = defineMessages({
  courses: {
    defaultMessage: 'Your courses',
    description: 'Filtered courses title',
    id: 'components.TeacherCoursesDashboardLoader.title.filteredCourses',
  },
  incoming: {
    defaultMessage: 'Incoming',
    description: 'Incoming courses title',
    id: 'components.TeacherCoursesDashboardLoader.title.incoming',
  },
  ongoing: {
    defaultMessage: 'Ongoing',
    description: 'Ongoing courses title',
    id: 'components.TeacherCoursesDashboardLoader.title.ongoing',
  },
  archived: {
    defaultMessage: 'Archived',
    description: 'Archived courses title',
    id: 'components.TeacherCoursesDashboardLoader.title.archived',
  },
});

export const TeacherCoursesDashboardLoader = () => {
  const intl = useIntl();
  return (
    <DashboardLayout sidebar={<TeacherProfileDashboardSidebar />}>
      <div className="teacher-courses-page">
        <TeacherDashboardCourseList titleTranslated={intl.formatMessage(messages.courses)} />
      </div>
    </DashboardLayout>
  );
};
