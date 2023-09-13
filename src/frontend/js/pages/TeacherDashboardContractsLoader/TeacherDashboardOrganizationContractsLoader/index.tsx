import { FormattedMessage, defineMessages } from 'react-intl';
import { useParams } from 'react-router-dom';
import queryString from 'query-string';

import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherDashboardOrganizationSidebar } from 'widgets/Dashboard/components/TeacherDashboardOrganizationSidebar';
import { location } from 'utils/indirection/window';
import TeacherDashboardContracts from '../TeacherDashboardContracts';

const messages = defineMessages({
  pageTitle: {
    defaultMessage: 'Contracts',
    description: 'Use for the page title of the organization contracts area',
    id: 'pages.TeacherDashboardOrganizationContractsLoader.pageTitle',
  },
  loading: {
    defaultMessage: 'Loading contracts...',
    description: 'Message displayed while loading contracts',
    id: 'pages.TeacherDashboardOrganizationContractsLoader.loading',
  },
});

export const TeacherDashboardOrganizationContractsLoader = () => {
  const { organizationId } = useParams<{ organizationId?: string }>();
  const { page = '1' }: { page?: string } = queryString.parse(location.search);
  return (
    <DashboardLayout sidebar={<TeacherDashboardOrganizationSidebar />}>
      <div className="dashboard__page_title_container">
        <h1 className="dashboard__page_title">
          <FormattedMessage {...messages.pageTitle} />
        </h1>
      </div>
      <TeacherDashboardContracts organizationId={organizationId} page={page} />
    </DashboardLayout>
  );
};
