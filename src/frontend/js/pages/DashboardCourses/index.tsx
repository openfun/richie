import { useEffect, useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { useEnrollments } from 'hooks/useEnrollments';
import { Enrollment, Order } from 'types/Joanie';
import { Pagination, usePagination } from 'components/Pagination';
import { Spinner } from 'components/Spinner';
import { DashboardItemEnrollment } from 'widgets/Dashboard/components/DashboardItem/Enrollment/DashboardItemEnrollment';
import Banner, { BannerType } from 'components/Banner';

type Data = {
  type: 'enrollment' | 'order';
  item: Enrollment | Order;
};

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading orders and enrollments...',
    description: 'Message displayed while loading orders and enrollments',
    id: 'components.DashboardCourses.loading',
  },
});

export const DashboardCourses = () => {
  const pagination = usePagination({ itemsPerPage: 10 });
  const [data, setData] = useState<Data[]>([]);

  const enrollments = useEnrollments(
    {
      was_created_by_order: false,
      page: pagination.currentPage,
      page_size: pagination.itemsPerPage,
    },
    { keepPreviousData: true },
  );

  useEffect(() => {
    const newData = enrollments.items.map(
      (item) =>
        ({
          type: 'enrollment',
          item,
        } as Data),
    );
    setData(newData);
  }, [enrollments.items]);

  useEffect(() => {
    if (enrollments.meta?.pagination?.count) {
      pagination.setItemsCount(enrollments.meta.pagination.count);
    }
  }, [enrollments.meta?.pagination?.count]);

  return (
    <div className="dashboard__courses">
      {enrollments.states.error && (
        <Banner message={enrollments.states.error} type={BannerType.ERROR} />
      )}
      {data.length === 0 && enrollments.states.fetching ? (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      ) : (
        <div
          className={[
            'dashboard__courses__list',
            enrollments.states.fetching ? 'dashboard__list--loading' : '',
          ].join(' ')}
        >
          {data.map(
            (datum) =>
              datum.type === 'enrollment' && (
                <DashboardItemEnrollment
                  key={datum.item.id}
                  enrollment={datum.item as Enrollment}
                />
              ),
          )}
        </div>
      )}
      <div>
        <Pagination {...pagination} />
      </div>
    </div>
  );
};
