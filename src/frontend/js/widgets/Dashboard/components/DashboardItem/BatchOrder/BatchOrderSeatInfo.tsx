import { useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { Icon, IconTypeEnum } from 'components/Icon';
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
});

const ITEMS_PER_PAGE = 10;

interface BatchOrderSeatInfoProps {
  batchOrder: BatchOrderRead;
}

export const BatchOrderSeatInfo = ({ batchOrder }: BatchOrderSeatInfoProps) => {
  const intl = useIntl();
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [vouchersOpen, setVouchersOpen] = useState(false);
  const [studentsLimit, setStudentsLimit] = useState(ITEMS_PER_PAGE);
  const [vouchersLimit, setVouchersLimit] = useState(ITEMS_PER_PAGE);

  const { items: seats } = useBatchOrderSeats(
    { batch_order_id: batchOrder.id },
    { enabled: !!batchOrder.id },
  );

  const seatsOwned = seats?.filter((seat) => seat.owner_name) || [];
  const seatsToOwn = seats?.filter((seat) => !seat.owner_name) || [];
  const seatsOwnedCount = batchOrder.seats_owned;
  const seatsToOwnCount = batchOrder.seats_to_own;

  const displayedStudents = seatsOwned.slice(0, studentsLimit);
  const displayedVouchers = seatsToOwn.slice(0, vouchersLimit);

  const hasInfo =
    seatsOwned && seatsToOwn && batchOrder.nb_seats && seatsOwnedCount && seatsToOwnCount;

  return (
    hasInfo && (
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
                  name={
                    studentsOpen ? IconTypeEnum.CHEVRON_DOWN : IconTypeEnum.CHEVRON_RIGHT_OUTLINE
                  }
                  size="small"
                />
                <span className="dashboard-item__label">
                  <FormattedMessage {...messages.enrolledStudents} /> ({seatsOwnedCount})
                </span>
              </button>
              {studentsOpen && (
                <div className="enrollment-nested-section__content">
                  <ul className="enrollment-list">
                    {displayedStudents.map((student) => (
                      <li key={student.id}>{student.owner_name}</li>
                    ))}
                  </ul>
                  {seatsOwnedCount > studentsLimit && (
                    <Button
                      size="small"
                      color="tertiary"
                      onClick={() => setStudentsLimit((prev) => prev + ITEMS_PER_PAGE)}
                      className="enrollment-load-more"
                    >
                      <FormattedMessage
                        id="batchOrder.enrollmentManagement.loadMore"
                        defaultMessage="Load {count} more"
                        description="Load more button label"
                        values={{ count: ITEMS_PER_PAGE }}
                      />
                    </Button>
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
                  name={
                    vouchersOpen ? IconTypeEnum.CHEVRON_DOWN : IconTypeEnum.CHEVRON_RIGHT_OUTLINE
                  }
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
                  {seatsToOwnCount > vouchersLimit && (
                    <Button
                      size="small"
                      color="tertiary"
                      onClick={() => setVouchersLimit((prev) => prev + ITEMS_PER_PAGE)}
                      className="enrollment-load-more"
                    >
                      <FormattedMessage
                        id="batchOrder.enrollmentManagement.loadMore"
                        defaultMessage="Load {count} more"
                        description="Load more button label"
                        values={{ count: ITEMS_PER_PAGE }}
                      />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        }
      />
    )
  );
};
