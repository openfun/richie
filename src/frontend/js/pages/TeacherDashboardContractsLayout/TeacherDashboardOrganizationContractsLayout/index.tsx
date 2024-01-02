import { defineMessages, FormattedMessage } from 'react-intl';

import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherDashboardOrganizationSidebar } from 'widgets/Dashboard/components/TeacherDashboardOrganizationSidebar';
import TeacherDashboardContracts from '../TeacherDashboardContracts';

const messages = defineMessages({
  pageTitle: {
    defaultMessage: 'Contracts',
    description: 'Use for the page title of the organization contracts area',
    id: 'pages.TeacherDashboardOrganizationContractsLayout.pageTitle',
  },
});

export const TeacherDashboardOrganizationContractsLayout = () => {
  return (
    <DashboardLayout sidebar={<TeacherDashboardOrganizationSidebar />}>
      <div className="dashboard__page_title_container">
        <h1 className="dashboard__page_title">
          <FormattedMessage {...messages.pageTitle} />
        </h1>
      </div>
      <TeacherDashboardContracts />
    </DashboardLayout>
  );
};
