import { useEffect, useState } from 'react';

import { useEnrollments } from 'hooks/useEnrollments';
import { Enrollment, Order } from 'types/Joanie';
import { Pagination, usePagination } from 'components/Pagination';

type Data = {
  discr: 'enrollment' | 'order';
  item: Enrollment | Order;
};

export const DashboardCourses = () => {
  // const orders = useOrders();

  const pagination = usePagination();
  const [data, setData] = useState<Data[]>([]);

  const enrollments = useEnrollments({ was_created_by_order: false, page: pagination.currentPage });
  console.log(enrollments.items, pagination.currentPage);
  useEffect(() => {
    const newData = enrollments.items.map(
      (item) =>
        ({
          discr: 'enrollment',
          item,
        } as Data),
    );
    setData(newData);
  }, [enrollments.items]);

  return (
    <div className="dashboard__courses">
      <div>
        {data.map(
          (item) =>
            item.discr === 'enrollment' &&
            // <DashboardItemEnrollment enrollment={item.item as Enrollment} />
            JSON.stringify(item),
        )}
      </div>
      <div>
        <Pagination {...pagination} />
      </div>
    </div>
  );
};
