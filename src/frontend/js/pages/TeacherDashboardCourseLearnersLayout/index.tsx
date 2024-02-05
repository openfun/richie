import { FormattedMessage, defineMessages } from 'react-intl';

import { TeacherDashboardCourseSidebar } from 'widgets/Dashboard/components/TeacherDashboardCourseSidebar';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import TeacherDashboardLearners from './TeacherDashboardLearners';

const messages = defineMessages({
  pageTitle: {
    defaultMessage: 'Learners',
    description: "Use for the page title of the course's contracts page",
    id: 'pages.TeacherDashboardCourseLearnersLayout.pageTitle',
  },
});

export const TeacherDashboardCourseLearnersLayout = () => {
  return (
    <DashboardLayout sidebar={<TeacherDashboardCourseSidebar />}>
      <div className="dashboard__page_title_container">
        <h1 className="dashboard__page_title">
          <FormattedMessage {...messages.pageTitle} />
        </h1>
      </div>
      <TeacherDashboardLearners />
    </DashboardLayout>
  );
};
