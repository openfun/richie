import { defineMessages, FormattedMessage } from 'react-intl';

import { usePagination } from '@openfun/cunningham-react';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { TeacherDashboardOrganizationSidebar } from 'widgets/Dashboard/components/TeacherDashboardOrganizationSidebar';
import Banner, { BannerType } from 'components/Banner';
import { PER_PAGE } from 'settings';
import { useOrganizationContracts } from 'hooks/useContracts';
import { ContractFilters } from 'types/Joanie';
import TeacherDashboardContracts from '../TeacherDashboardContracts';
import useTeacherContractFilters from '../hooks/useTeacherContractFilters';

const messages = defineMessages({
  pageTitle: {
    defaultMessage: 'Contracts',
    description: 'Use for the page title of the organization contracts area',
    id: 'pages.TeacherDashboardOrganizationContractsLayout.pageTitle',
  },
});

export const TeacherDashboardOrganizationContractsLayout = () => {
  const { initialFilters, filters, setFilters } = useTeacherContractFilters();
  const [searchParams] = useSearchParams();
  const page = searchParams.get('page') ?? '1';
  const pagination = usePagination({
    defaultPage: page ? parseInt(page, 10) : 1,
    pageSize: PER_PAGE.teacherContractList,
  });
  const {
    items: contracts,
    meta,
    states: { fetching, isFetched, error },
  } = useOrganizationContracts(
    {
      ...filters,
      page: pagination.page,
      page_size: PER_PAGE.teacherContractList,
    },
    { enabled: !!filters.organization_id },
  );

  const handleFiltersChange = (newFilters: Partial<ContractFilters>) => {
    // Reset pagination
    pagination.setPage(1);
    setFilters((prevFilters) => ({ ...prevFilters, ...newFilters }));
  };

  useEffect(() => {
    if (isFetched && meta?.pagination?.count !== undefined) {
      pagination.setPagesCount(Math.ceil(meta!.pagination!.count / PER_PAGE.teacherContractList));
    }
  }, [isFetched, meta?.pagination?.count]);

  if (error) {
    return <Banner message={error} type={BannerType.ERROR} rounded />;
  }

  return (
    <DashboardLayout sidebar={<TeacherDashboardOrganizationSidebar />}>
      <div className="dashboard__page_title_container">
        <h1 className="dashboard__page_title">
          <FormattedMessage {...messages.pageTitle} />
        </h1>
      </div>
      <TeacherDashboardContracts
        contracts={contracts}
        pagination={pagination}
        isLoading={fetching}
        filters={filters}
        initialFilters={initialFilters}
        handleFiltersChange={handleFiltersChange}
      />
    </DashboardLayout>
  );
};
