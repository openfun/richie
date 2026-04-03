import { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Input } from '@openfun/cunningham-react';
import { Icon, IconTypeEnum } from 'components/Icon';
import { Pagination, usePagination } from 'components/Pagination';
import { DashboardSubItem } from 'widgets/Dashboard/components/DashboardItem/DashboardSubItem';
import { useBatchOrderSeats } from 'hooks/useBatchOrder';
import { BatchOrderRead } from 'types/Joanie';

const messages = defineMessages({
  enrollmentManagement: {
    id: 'batchOrder.enrollmentManagement.title',
    description: 'Title for enrollment management section',
    defaultMessage: 'Enrollment',
  },
  enrolledStudents: {
    id: 'batchOrder.enrollmentManagement.enrolledStudents',
    description: 'Title for enrolled students section',
    defaultMessage: 'Enrolled Students',
  },
  availableVouchers: {
    id: 'batchOrder.enrollmentManagement.availableVouchers',
    description: 'Title for available vouchers section',
    defaultMessage: 'Available Vouchers',
  },
  searchPlaceholder: {
    id: 'batchOrder.enrollmentManagement.searchPlaceholder',
    description: 'Placeholder for the student search input',
    defaultMessage: 'Name',
  },
  noResults: {
    id: 'batchOrder.enrollmentManagement.noResults',
    description: 'Message shown when the student search returns no results',
    defaultMessage: 'No student matches your search.',
  },
});

const ITEMS_PER_PAGE = 10;

interface BatchOrderSeatInfoProps {
  batchOrder: BatchOrderRead;
}

export const BatchOrderSeatInfo = ({ batchOrder }: BatchOrderSeatInfoProps) => {
  const intl = useIntl();
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [vouchersOpen, setVouchersOpen] = useState(false);
  const [studentQuery, setStudentQuery] = useState('');

  const studentsPagination = usePagination({ itemsPerPage: ITEMS_PER_PAGE });
  const vouchersPagination = usePagination({ itemsPerPage: ITEMS_PER_PAGE });

  const seatsOwnedCount = batchOrder.seats_owned!;
  const seatsToOwnCount = batchOrder.seats_to_own!;

  const { items: studentSeats } = useBatchOrderSeats(
    {
      batch_order_id: batchOrder.id,
      query: studentQuery || undefined,
      page: studentsPagination.currentPage,
      page_size: ITEMS_PER_PAGE,
    },
    { enabled: !!batchOrder.id && studentsOpen },
  );

  const { items: voucherSeats } = useBatchOrderSeats(
    {
      batch_order_id: batchOrder.id,
      page: vouchersPagination.currentPage,
      page_size: ITEMS_PER_PAGE,
    },
    { enabled: !!batchOrder.id && vouchersOpen },
  );

  useEffect(() => {
    studentsPagination.setItemsCount(seatsOwnedCount);
  }, [seatsOwnedCount]);

  useEffect(() => {
    vouchersPagination.setItemsCount(seatsToOwnCount);
  }, [seatsToOwnCount]);

  useEffect(() => {
    studentsPagination.setCurrentPage(1);
  }, [studentQuery]);

  if (!batchOrder.nb_seats || seatsOwnedCount === undefined || seatsToOwnCount === undefined) {
    return null;
  }

  const displayedStudents = studentSeats.filter((s) => s.owner_name !== null);
  const displayedVouchers = voucherSeats.filter((s) => s.owner_name === null);

  return (
    <DashboardSubItem
      title={intl.formatMessage(messages.enrollmentManagement)}
      footer={
        <div className="content">
          <div className="enrollment-progress">
            <span className="dashboard-item__label">
              {seatsOwnedCount}/{batchOrder.nb_seats}
            </span>
            <div className="enrollment-progress__bar">
              <div
                className="enrollment-progress__bar__fill"
                style={{ width: `${(seatsOwnedCount / batchOrder.nb_seats) * 100}%` }}
              />
            </div>
          </div>
          <div className="enrollment-nested-section">
            <button
              className="enrollment-nested-section__toggle"
              onClick={() => setStudentsOpen(!studentsOpen)}
              type="button"
            >
              <Icon
                name={studentsOpen ? IconTypeEnum.CHEVRON_DOWN : IconTypeEnum.CHEVRON_RIGHT_OUTLINE}
                size="small"
              />
              <span className="dashboard-item__label">
                <FormattedMessage {...messages.enrolledStudents} /> ({seatsOwnedCount})
              </span>
            </button>
            {studentsOpen && (
              <div className="enrollment-nested-section__content">
                <Input
                  className="enrollment-search"
                  label={intl.formatMessage(messages.searchPlaceholder)}
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  rightIcon={<Icon name={IconTypeEnum.MAGNIFYING_GLASS} size="small" />}
                />
                {displayedStudents.length === 0 && studentQuery ? (
                  <FormattedMessage {...messages.noResults} />
                ) : (
                  <>
                    <ul className="enrollment-list">
                      {displayedStudents.map((student) => (
                        <li key={student.id}>{student.owner_name}</li>
                      ))}
                    </ul>
                    <div className="enrollment-pagination-wrapper">
                      <Pagination
                        {...studentsPagination}
                        onPageChange={studentsPagination.setCurrentPage}
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="enrollment-nested-section">
            <button
              className="enrollment-nested-section__toggle"
              onClick={() => setVouchersOpen(!vouchersOpen)}
              type="button"
            >
              <Icon
                name={vouchersOpen ? IconTypeEnum.CHEVRON_DOWN : IconTypeEnum.CHEVRON_RIGHT_OUTLINE}
                size="small"
              />
              <span className="dashboard-item__label">
                <FormattedMessage {...messages.availableVouchers} /> ({seatsToOwnCount})
              </span>
            </button>
            {vouchersOpen && (
              <div className="enrollment-nested-section__content">
                <ul className="enrollment-list">
                  {displayedVouchers.map((voucher) => (
                    <li key={voucher.id}>{voucher.voucher}</li>
                  ))}
                </ul>
                <div className="enrollment-pagination-wrapper">
                  <Pagination
                    {...vouchersPagination}
                    onPageChange={vouchersPagination.setCurrentPage}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      }
    />
  );
};
