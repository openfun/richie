import { useEffect, useState } from 'react';

import { useEnrollments } from 'hooks/useEnrollments';
import { Enrollment, Order } from 'types/Joanie';
import { Pagination, usePagination } from 'components/Pagination';
import { DashboardItemEnrollment } from 'components/DashboardItem/Enrollment/DashboardItemEnrollment';
import { CourseFactory } from 'utils/test/factories';
import { Spinner } from 'components/Spinner';

type Data = {
  discr: 'enrollment' | 'order';
  item: Enrollment | Order;
};

export const DashboardCourses = () => {
  const pagination = usePagination();
  const [data, setData] = useState<Data[]>([]);

  const enrollments = useEnrollments(
    { was_created_by_order: false, page: pagination.currentPage },
    { keepPreviousData: true },
  );
  console.log(enrollments, pagination.currentPage);
  useEffect(() => {
    const newData = enrollments.items.map(
      (item) =>
        ({
          discr: 'enrollment',
          item: { ...item, course_run: { ...item.course_run, course: CourseFactory.generate() } },
        } as Data),
    );
    setData(newData);
  }, [enrollments.items]);

  useEffect(() => {
    if (enrollments.meta?.pagination?.count) {
      pagination.setItemsCount(enrollments.meta.pagination.count);
    }
  });

  return (
    <div className="dashboard__courses">
      {data.length === 0 ? (
        <Spinner />
      ) : (
        <div
          className={[
            'dashboard__courses__list',
            enrollments.states.fetching ? 'dashboard__courses__list--loading' : '',
          ].join(' ')}
        >
          {data.map(
            (datum) =>
              datum.discr === 'enrollment' && (
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
