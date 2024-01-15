import { FormattedMessage, defineMessages } from 'react-intl';

import { TeacherDashboardCourseSidebar } from 'widgets/Dashboard/components/TeacherDashboardCourseSidebar';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import TeacherDashboardContracts from '../TeacherDashboardContracts';

const messages = defineMessages({
  pageTitle: {
    defaultMessage: 'Contracts',
    description: "Use for the page title of the course's contracts page",
    id: 'pages.TeacherDashboardCourseContractsLayout.pageTitle',
  },
});

export const TeacherDashboardCourseContractsLayout = () => {
  const {
    items: contracts,
    meta,
    states: { fetching, isFetched, error },
  } = useContracts(
    {
      ...filters,
      page: pagination.page,
      page_size: PER_PAGE.teacherContractList,
    },
    { enabled: !!filters.organization_id },
  );

  return (
    <DashboardLayout sidebar={<TeacherDashboardCourseSidebar />}>
      <div className="dashboard__page_title_container">
        <h1 className="dashboard__page_title">
          <FormattedMessage {...messages.pageTitle} />
        </h1>
      </div>
      <TeacherDashboardContracts />
    </DashboardLayout>
  );
};
