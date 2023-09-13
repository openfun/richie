import { FormattedMessage, defineMessages } from 'react-intl';
import { useParams } from 'react-router-dom';
import queryString from 'query-string';

import { useState } from 'react';
import { TeacherDashboardCourseSidebar } from 'widgets/Dashboard/components/TeacherDashboardCourseSidebar';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { location } from 'utils/indirection/window';
import TeacherDashboardContracts from '../TeacherDashboardContracts';
import ContractFilters, { ContractListFilters } from '../ContractFilters';

const messages = defineMessages({
  pageTitle: {
    defaultMessage: 'Contracts',
    description: "Use for the page title of the course's contracts page",
    id: 'pages.TeacherDashboardCourseContractsLoader.pageTitle',
  },
  loading: {
    defaultMessage: 'Loading contracts...',
    description: 'Message displayed while loading contracts',
    id: 'pages.TeacherDashboardCourseContractsLoader.loading',
  },
});

export const TeacherDashboardCourseContractsLoader = () => {
  const { courseId } = useParams<{ courseId?: string }>();
  const { page = '1' }: { page?: string } = queryString.parse(location.search);
  const [filters, setFilters] = useState<ContractListFilters>({});
  const onFiltersChange = (newFilters: ContractListFilters) => {
    setFilters(newFilters);
  };

  return (
    <DashboardLayout
      sidebar={<TeacherDashboardCourseSidebar />}
      filters={<ContractFilters onFiltersChange={onFiltersChange} />}
    >
      <div className="dashboard__page_title_container">
        <h1 className="dashboard__page_title">
          <FormattedMessage {...messages.pageTitle} />
        </h1>
      </div>
      <TeacherDashboardContracts
        courseId={courseId}
        organizationId={filters.organizationId}
        page={page}
      />
    </DashboardLayout>
  );
};
