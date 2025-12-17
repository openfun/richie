import { defineMessages, FormattedMessage } from 'react-intl';
import TeacherDashboardOrganizationAgreements from 'pages/TeacherDashboardOrganizationAgreements';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherDashboardOrganizationSidebar } from 'widgets/Dashboard/components/TeacherDashboardOrganizationSidebar';

const messages = defineMessages({
  pageTitle: {
    defaultMessage: 'Agreements',
    description: 'Use for the page title of the organization agreements',
    id: 'pages.TeacherDashboardOrganizationAgreementsLayout.pageTitle',
  },
});

export const TeacherDashboardOrganizationAgreementsLayout = () => {
  return (
    <DashboardLayout sidebar={<TeacherDashboardOrganizationSidebar />}>
      <div className="dashboard__page_title_container">
        <h1 className="dashboard__page_title">
          <FormattedMessage {...messages.pageTitle} />
        </h1>
      </div>
      <TeacherDashboardOrganizationAgreements />
    </DashboardLayout>
  );
};
