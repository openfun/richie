import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { Button, DataGrid, DataGridProps, PaginationProps, Row } from '@openfun/cunningham-react';
import { useMemo } from 'react';
import { NestedCourseOrder } from 'types/Joanie';
import { DEFAULT_DATE_FORMAT } from 'hooks/useDateFormat';
import OrderStateTeacherMessage from 'widgets/Dashboard/components/DashboardItem/Order/OrderStateTeacherMessage';
import DashboardListAvatar from 'widgets/Dashboard/components/DashboardListAvatar';

const messages = defineMessages({
  columnLearnerName: {
    defaultMessage: 'Learner',
    description: "Label for learner's name column",
    id: 'pages.CourseLearnerDataGrid.columnLearnerName',
  },
  columnActions: {
    defaultMessage: 'Actions',
    description: 'Label for actions column',
    id: 'pages.CourseLearnerDataGrid.columnActions',
  },
  columnPurchaseDate: {
    defaultMessage: 'Enrolled on',
    description: 'Label for enrolled date column',
    id: 'pages.CourseLearnerDataGrid.columnPurchaseDate',
  },
  columnState: {
    defaultMessage: 'State',
    description: 'Label for state column',
    id: 'pages.CourseLearnerDataGrid.columnState',
  },
  contactButton: {
    defaultMessage: 'Contact',
    description: 'Label for the contact learner button',
    id: 'pages.CourseLearnerDataGrid.contactButton',
  },
});

interface CourseLearnerDataGridProps {
  courseOrders: NestedCourseOrder[];
  sortModel: DataGridProps['sortModel'];
  setSortModel: DataGridProps['onSortModelChange'];
  pagination: PaginationProps;
  isLoading: boolean;
}

const CourseLearnerDataGrid = ({
  courseOrders,
  sortModel,
  setSortModel,
  pagination,
  isLoading,
}: CourseLearnerDataGridProps) => {
  const intl = useIntl();

  const columns = [
    {
      id: 'avatar',
      enableSorting: false,
      renderCell: (params: { row: Row }) => {
        return <DashboardListAvatar title={params.row.owner__full_name} />;
      },
    },
    {
      field: 'owner__full_name',
      headerName: intl.formatMessage(messages.columnLearnerName),
      enableSorting: false,
    },
    {
      field: 'created_on',
      headerName: intl.formatMessage(messages.columnPurchaseDate),
      enableSorting: false,
    },
    {
      id: 'orderState',
      headerName: intl.formatMessage(messages.columnState),
      enableSorting: false,
      renderCell: (params: { row: Row }) => {
        return (
          <OrderStateTeacherMessage
            order={params.row.courseOrder}
            contractDefinition={params.row.courseOrder.product.contract_definition_id}
          />
        );
      },
    },
    {
      id: 'actions',
      headerName: intl.formatMessage(messages.columnActions),
      renderCell: (params: { row: Row }) => {
        return (
          <Button href={`mailto:${params.row.owner__email}`} size="small" color="secondary">
            <FormattedMessage {...messages.contactButton} />
          </Button>
        );
      },
      enableSorting: false,
    },
  ];

  const rows = useMemo(() => {
    return courseOrders.map((courseOrder) => ({
      id: courseOrder.id,
      owner__full_name: courseOrder.owner.full_name || courseOrder.owner.username,
      owner__email: courseOrder.owner.email,
      created_on: intl.formatDate(new Date(courseOrder.created_on), DEFAULT_DATE_FORMAT),
      courseOrder,
    }));
  }, [courseOrders]);

  return (
    <DataGrid
      columns={columns}
      rows={rows}
      pagination={pagination}
      sortModel={sortModel}
      onSortModelChange={setSortModel}
      isLoading={isLoading}
    />
  );
};

export default CourseLearnerDataGrid;
