import { defineMessages, FormattedMessage } from 'react-intl';
import TeacherDashboardOrganizationQuotes from 'pages/TeacherDashboardOrganizationQuotes';

import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherDashboardOrganizationSidebar } from 'widgets/Dashboard/components/TeacherDashboardOrganizationSidebar';

const messages = defineMessages({
  pageTitle: {
    defaultMessage: 'Manage my quotes',
    description: 'Use for the page title of the organization quotes',
    id: 'pages.TeacherDashboardOrganizationQuotesLayout.pageTitle',
  },
});

export const TeacherDashboardOrganizationQuotesLayout = () => {
  return (
    <DashboardLayout sidebar={<TeacherDashboardOrganizationSidebar />}>
      <div className="dashboard__page_title_container">
        <h1 className="dashboard__page_title">
          <FormattedMessage {...messages.pageTitle} />
        </h1>
      </div>
      <TeacherDashboardOrganizationQuotes />
    </DashboardLayout>
  );
};
