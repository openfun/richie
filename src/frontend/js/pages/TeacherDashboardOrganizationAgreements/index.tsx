import { defineMessages, useIntl } from 'react-intl';

import { DataGrid, usePagination } from '@openfun/cunningham-react';
import { useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router';
import Banner, { BannerType } from 'components/Banner';
import { PER_PAGE } from 'settings';
import { ContractResourceQuery } from 'types/Joanie';

import { useOrganizations } from 'hooks/useOrganizations';
import useTeacherContractFilters, {
  TeacherDashboardContractsParams,
} from 'pages/TeacherDashboardContractsLayout/hooks/useTeacherContractFilters';
import ContractFiltersBar from 'pages/TeacherDashboardContractsLayout/components/ContractFiltersBar';
import { useOrganizationAgreements } from 'hooks/useOrganizationAgreements.tsx';
import AgreementActionsBar from './AgreementActionsBar';

const messages = defineMessages({
  columnProductTitle: {
    defaultMessage: 'Training',
    description: 'Label for productTitle column',
    id: 'pages.TeacherDashboardOrganizationContractsLayout.columnProductTitle',
  },
  columnLearnerName: {
    defaultMessage: 'Learner',
    description: 'Label for learnerName column',
    id: 'pages.TeacherDashboardOrganizationContractsLayout.columnLearnerName',
  },
  columnState: {
    defaultMessage: 'State',
    description: 'Label for state column',
    id: 'pages.TeacherDashboardOrganizationContractsLayout.columnState',
  },
});

const TeacherDashboardOrganizationAgreements = () => {
  const intl = useIntl();
  const [searchParams] = useSearchParams();
  const page = searchParams.get('page') ?? '1';
  const pagination = usePagination({
    defaultPage: page ? parseInt(page, 10) : 1,
    pageSize: PER_PAGE.teacherContractList,
  });
  const { organizationId: routeOrganizationId, offeringId: routeOfferingId } =
    useParams<TeacherDashboardContractsParams>();
  // organization list is used to show/hide organization filter.
  // when organizationId is in route's params this filter is always hidden.
  // therefore we don't need to enable this query.
  const {
    items: organizationList,
    states: { isFetched: isOrganizationListFetched },
  } = useOrganizations({ offering_id: routeOfferingId }, { enabled: !routeOrganizationId });
  const hasMultipleOrganizations = isOrganizationListFetched && organizationList.length > 1;
  const { initialFilters, filters, setFilters } = useTeacherContractFilters();
  const {
    items: agreements,
    meta,
    states: { fetching, isFetched, error },
  } = useOrganizationAgreements({
    ...filters,
    page: pagination.page,
    page_size: PER_PAGE.teacherContractList,
  });

  const rows = useMemo(() => {
    return agreements.map((agreement) => ({
      id: agreement.id,
      learnerName: agreement.batch_order.owner_name,
      productTitle: agreement.batch_order.relation.product.title,
      state: agreement.batch_order.state,
    }));
  }, [agreements]);

  const handleFiltersChange = (newFilters: Partial<ContractResourceQuery>) => {
    // Reset pagination
    pagination.setPage(1);
    setFilters((prevFilters: any) => ({ ...prevFilters, ...newFilters }));
  };

  useEffect(() => {
    if (isFetched && meta?.pagination?.count) {
      pagination.setPagesCount(Math.ceil(meta!.pagination!.count / PER_PAGE.teacherContractList));
    }
  }, [meta, isFetched]);

  if (error) {
    return <Banner message={error} type={BannerType.ERROR} rounded />;
  }

  return (
    <div className="teacher-contract-page">
      <div className="dashboard__page__actions">
        <AgreementActionsBar
          organizationId={filters.organization_id!}
          offeringId={filters.offering_id}
        />
        <ContractFiltersBar
          defaultValues={initialFilters}
          onFiltersChange={handleFiltersChange}
          organizationList={organizationList}
          hideFilterOrganization={!!(routeOrganizationId || !hasMultipleOrganizations)}
        />
      </div>
      <DataGrid
        columns={[
          {
            field: 'productTitle',
            headerName: intl.formatMessage(messages.columnProductTitle),
            enableSorting: false,
          },
          {
            field: 'learnerName',
            headerName: intl.formatMessage(messages.columnLearnerName),
            enableSorting: false,
          },
          {
            field: 'state',
            headerName: intl.formatMessage(messages.columnState),
            enableSorting: false,
          },
        ]}
        rows={rows}
        pagination={pagination}
        isLoading={fetching}
      />
    </div>
  );
};

export default TeacherDashboardOrganizationAgreements;
