import { defineMessages, useIntl } from 'react-intl';

import { Button, DataGrid, SortModel, usePagination } from '@openfun/cunningham-react';
import { useEffect, useMemo, useState } from 'react';
import { useContracts } from 'hooks/useContacts';
import Banner, { BannerType } from 'components/Banner';
import { PER_PAGE } from 'settings';
import { ContractFilters } from 'types/Joanie';

const messages = defineMessages({
  errorNoCourseProductRelation: {
    defaultMessage: "This product doesn't exist",
    description: 'Message displayed when requested course product relation is not found',
    id: 'pages.TeacherDashboardContracts.errorNoCourseProductRelation',
  },
});

export interface TeacherDashboardContractsProps {
  courseId?: string;
  organizationId?: string;
  page?: string;
}

const TeacherDashboardContracts = ({
  courseId,
  organizationId,
  page,
}: TeacherDashboardContractsProps) => {
  const intl = useIntl();
  const [contractFilters, setContractFilters] = useState<ContractFilters>({
    course_id: courseId,
    organization_id: organizationId,
    page: page ? parseInt(page, 10) : 1,
    page_size: PER_PAGE.teacherContractList,
  });
  useEffect(() => {
    setContractFilters((currentFilters: ContractFilters) => ({
      ...currentFilters,
      organization_id: organizationId,
    }));
  }, [organizationId]);

  const {
    items: contracts,
    meta,
    states: { fetching, isFetched },
  } = useContracts(contractFilters);

  const [sortModel, setSortModel] = useState<SortModel>([
    {
      field: 'learnerName',
      sort: 'desc',
    },
    {
      field: 'productTitle',
      sort: 'desc',
    },
    {
      field: 'signDate',
      sort: 'desc',
    },
  ]);

  const pagination = usePagination({
    defaultPage: page ? parseInt(page, 10) : 1,
    pageSize: PER_PAGE.teacherContractList,
  });
  useEffect(() => {
    if (isFetched) {
      pagination.setPagesCount(Math.ceil(meta!.pagination!.count / PER_PAGE.teacherContractList));
    }
  }, [contracts, isFetched]);

  const onPageChange = (newPage: number) => {
    setContractFilters((currentFilters: ContractFilters) => ({ ...currentFilters, page: newPage }));
  };
  useEffect(() => onPageChange(pagination.page), [pagination.page]);

  const rows = useMemo(() => {
    return contracts.map(({ id, learner_name, product_title, sign_date }) => ({
      id,
      learnerName: learner_name,
      productTitle: product_title,
      signDate: intl.formatDate(sign_date),
    }));
  }, [contracts]);

  return contracts ? (
    <div className="teacher-contract-page" data-testid={isFetched ? 'contracts-loaded' : undefined}>
      <DataGrid
        columns={[
          {
            field: 'learnerName',
            headerName: 'Learner',
          },
          {
            id: 'productTitle',
            headerName: 'Product',
            renderCell: ({ row: { productTitle } }) => (
              <div className="product-title-column">{productTitle}</div>
            ),
          },
          {
            field: 'signDate',
            headerName: 'Date',
          },
          {
            id: 'actions',
            renderCell: () => (
              <div className="actions-column">
                <Button
                  color="tertiary"
                  size="small"
                  icon={<span className="material-icons">visibility</span>}
                >
                  Open
                </Button>
                <Button
                  color="tertiary"
                  size="small"
                  icon={<span className="material-icons">download</span>}
                >
                  Download
                </Button>
              </div>
            ),
          },
        ]}
        rows={rows}
        pagination={pagination}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        isLoading={fetching}
      />
    </div>
  ) : (
    <Banner
      message={intl.formatMessage(messages.errorNoCourseProductRelation)}
      type={BannerType.ERROR}
      rounded
    />
  );
};

export default TeacherDashboardContracts;
export { TeacherDashboardCourseContractsLoader } from '../TeacherDashboardCourseContractsLoader';
export { TeacherDashboardOrganizationContractsLoader } from '../TeacherDashboardOrganizationContractsLoader';
