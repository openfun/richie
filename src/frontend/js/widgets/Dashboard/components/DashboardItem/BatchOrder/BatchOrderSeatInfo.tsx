import { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Button, Input } from '@openfun/cunningham-react';
import { Icon, IconTypeEnum } from 'components/Icon';
import Banner, { BannerType } from 'components/Banner';
import { DashboardSubItem } from 'widgets/Dashboard/components/DashboardItem/DashboardSubItem';
import { useBatchOrderSeats } from 'hooks/useBatchOrder';
import DownloadBatchOrderSeatsButton from 'components/DownloadBatchOrderSeatsButton';
import { BatchOrderRead, BatchOrderSeat } from 'types/Joanie';

const messages = defineMessages({
  enrollmentManagement: {
    id: 'batchOrder.enrollmentManagement.title',
    description: 'Title for enrollment management section',
    defaultMessage: 'Enrollment',
  },
  enrolledParticipants: {
    id: 'batchOrder.enrollmentManagement.enrolledParticipants',
    description: 'Progress label showing enrolled participants out of total seats',
    defaultMessage: '{seats_owned}/{nb_seats} enrolled participants',
  },
  searchPlaceholder: {
    id: 'batchOrder.enrollmentManagement.searchPlaceholder',
    description: 'Placeholder for the seat search input (student name or voucher)',
    defaultMessage: 'Student name',
  },
  noResults: {
    id: 'batchOrder.enrollmentManagement.noResults',
    description: 'Message shown when the student search returns no results',
    defaultMessage: 'No student matches your search.',
  },
  loadMore: {
    id: 'batchOrder.enrollmentManagement.loadMore',
    description: 'Button to load more seats',
    defaultMessage: 'Load {count} more',
  },
});

const ITEMS_PER_PAGE = 10;

interface BatchOrderSeatInfoProps {
  batchOrder: BatchOrderRead;
}

export const BatchOrderSeatInfo = ({ batchOrder }: BatchOrderSeatInfoProps) => {
  const intl = useIntl();
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [allSeats, setAllSeats] = useState<BatchOrderSeat[]>([]);

  const seatsOwnedCount = batchOrder.seats_owned ?? 0;

  const {
    items: seats,
    meta,
    states,
  } = useBatchOrderSeats(
    {
      batch_order_id: batchOrder.id,
      query: query || undefined,
      page,
      page_size: ITEMS_PER_PAGE,
    },
    { enabled: !!batchOrder.id },
  );

  useEffect(() => {
    if (page === 1) {
      setAllSeats(seats);
    } else if (seats.length > 0) {
      setAllSeats((prev) => [...prev, ...seats]);
    }
  }, [seats]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const totalCount = meta?.pagination?.count ?? 0;
  const remainingCount = Math.min(ITEMS_PER_PAGE, totalCount - allSeats.length);

  if (
    !batchOrder.nb_seats ||
    batchOrder.seats_owned === undefined ||
    batchOrder.seats_to_own === undefined
  ) {
    return null;
  }

  return (
    <DashboardSubItem
      title={intl.formatMessage(messages.enrollmentManagement)}
      footer={
        <div className="content">
          <div className="enrollment-progress">
            <span className="dashboard-item__label">
              {intl.formatMessage(messages.enrolledParticipants, {
                seats_owned: seatsOwnedCount,
                nb_seats: batchOrder.nb_seats,
              })}
            </span>
            <div className="enrollment-progress__bar">
              <div
                className="enrollment-progress__bar__fill"
                style={{ width: `${(seatsOwnedCount / batchOrder.nb_seats) * 100}%` }}
              />
            </div>
          </div>
          {states.error && <Banner message={states.error} type={BannerType.ERROR} />}
          <div className="enrollment-nested-section__content">
            <Input
              className="enrollment-search"
              label={intl.formatMessage(messages.searchPlaceholder)}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rightIcon={<Icon name={IconTypeEnum.MAGNIFYING_GLASS} size="small" />}
            />
            {allSeats.length === 0 && query ? (
              <FormattedMessage {...messages.noResults} />
            ) : (
              <>
                <ul className="enrollment-list">
                  {allSeats.map((seat) => (
                    <li key={seat.id}>{seat.owner_name ?? seat.voucher}</li>
                  ))}
                </ul>
                {remainingCount > 0 && (
                  <Button
                    className="enrollment-load-more"
                    color="brand"
                    variant="secondary"
                    size="small"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={states.fetching}
                  >
                    {intl.formatMessage(messages.loadMore, { count: remainingCount })}
                  </Button>
                )}
              </>
            )}
          </div>
          <DownloadBatchOrderSeatsButton
            batchOrderId={batchOrder.id}
            productTitle={batchOrder.offering?.product.title ?? ''}
          />
        </div>
      }
    />
  );
};
