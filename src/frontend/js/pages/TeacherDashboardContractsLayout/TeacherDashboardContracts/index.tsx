import { defineMessages, useIntl } from 'react-intl';

import { DataGrid, usePagination } from '@openfun/cunningham-react';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { ContractHelper, ContractStatePoV } from 'utils/ContractHelper';
import { Contract, ContractFilters } from 'types/Joanie';

import ContractFiltersBar from '../components/ContractFilters';
import { TeacherDashboardContractsParams } from '../hooks/useTeacherContractFilters';
import ContractActionsBar from '../components/ContractActionsBar';

interface TeacherDashboardContractsProps {
  contracts: Contract[];
  pagination: ReturnType<typeof usePagination>;
  isLoading: boolean;
  initialFilters: ContractFilters;
  filters: ContractFilters;
  handleFiltersChange: (filters: ContractFilters) => void;
}

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

const TeacherDashboardContracts = ({
  contracts,
  pagination,
  isLoading,
  initialFilters,
  filters,
  handleFiltersChange,
}: TeacherDashboardContractsProps) => {
  const intl = useIntl();
  const { organizationId } = useParams<TeacherDashboardContractsParams>();
  const rows = useMemo(() => {
    return contracts.map((contract) => ({
      id: contract.id,
      learnerName: contract.order.owner_name,
      productTitle: contract.order.product_title,
      state: ContractHelper.getHumanReadableState(contract, ContractStatePoV.ORGANIZATION, intl),
    }));
  }, [contracts]);

  return (
    <div className="teacher-contract-page">
      <div className="dashboard__page__actions">
        <ContractActionsBar
          organizationId={filters.organization_id!}
          courseId={filters.course_id}
          productId={filters.product_id}
        />
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
        isLoading={isLoading}
      />
    </div>
  );
};

export default TeacherDashboardContracts;
