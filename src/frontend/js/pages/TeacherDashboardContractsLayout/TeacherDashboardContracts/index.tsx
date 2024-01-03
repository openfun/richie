import { defineMessages, useIntl } from 'react-intl';

import { DataGrid, usePagination } from '@openfun/cunningham-react';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ContractHelper, ContractStatePoV } from 'utils/ContractHelper';
import { useContracts } from 'hooks/useContracts';
import Banner, { BannerType } from 'components/Banner';
import { PER_PAGE } from 'settings';
import { ContractFilters, ContractState } from 'types/Joanie';
import ContractFiltersBar from 'pages/TeacherDashboardContractsLayout/ContractFilters';
import useContractAbilities from 'hooks/useContractAbilities';
import { ContractActions } from 'utils/AbilitiesHelper/types';
import SignOrganizationContractButton from 'pages/TeacherDashboardContractsLayout/SignOrganizationContractButton';

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

type TeacherDashboardContractsParams = {
  organizationId?: string;
  courseId?: string;
  productId?: string;
};

const TeacherDashboardContracts = () => {
  const intl = useIntl();
  const { courseId, organizationId, productId } = useParams<TeacherDashboardContractsParams>();
  const [searchParams] = useSearchParams();
  const page = searchParams.get('page') ?? '1';
  const pagination = usePagination({
    defaultPage: page ? parseInt(page, 10) : 1,
    pageSize: PER_PAGE.teacherContractList,
  });
  const initialFilters = useMemo(
    () => ({
      organization_id: organizationId,
      signature_state:
        (searchParams.get('signature_state') as ContractState) || ContractState.SIGNED,
    }),
    [],
  );
  const [filters, setFilters] = useState<ContractFilters>(initialFilters);

  const halfSignedContractsQuery = useContracts(
    {
      signature_state: ContractState.LEARNER_SIGNED,
      organization_id: filters.organization_id,
      course_id: courseId,
      product_id: productId,
    },
    { enabled: !!filters.organization_id },
  );
  const contractAbilities = useContractAbilities(halfSignedContractsQuery.items);
  const contractToSignCount = halfSignedContractsQuery.meta?.pagination?.count ?? 0;

  const {
    items: contracts,
    meta,
    states: { fetching, isFetched, error },
  } = useContracts(
    {
      ...filters,
      course_id: courseId,
      product_id: productId,
      page: pagination.page,
      page_size: PER_PAGE.teacherContractList,
    },
    { enabled: !!filters.organization_id },
  );

  const rows = useMemo(() => {
    return contracts.map((contract) => ({
      id: contract.id,
      learnerName: contract.order.owner_name,
      productTitle: contract.order.product_title,
      state: ContractHelper.getHumanReadableState(contract, ContractStatePoV.ORGANIZATION, intl),
    }));
  }, [contracts]);

  const handleFiltersChange = (newFilters: Partial<ContractFilters>) => {
    // Reset pagination
    pagination.setPage(1);
    setFilters((prevFilters) => ({ ...prevFilters, ...newFilters }));
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
        {filters.organization_id && contractAbilities.can(ContractActions.SIGN) && (
          <div className="dashboard__page__actions-row dashboard__page__actions-row--space-between">
            <div>
              <SignOrganizationContractButton
                organizationId={filters.organization_id}
                contractToSignCount={contractToSignCount}
              />
            </div>
          </div>
        )}
        <ContractFiltersBar
          defaultValues={initialFilters}
          onFiltersChange={handleFiltersChange}
          hideFilterOrganization={!!organizationId}
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

export default TeacherDashboardContracts;
export { TeacherDashboardCourseContractsLayout } from '../TeacherDashboardCourseContractsLayout';
export { TeacherDashboardOrganizationContractsLayout } from '../TeacherDashboardOrganizationContractsLayout';
