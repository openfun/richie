import { Outlet, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useMemo } from 'react';
import {
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'widgets/Dashboard/utils/dashboardRoutes';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { useOmniscientOrder } from 'hooks/useOrders';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';
import { CourseLight, Product } from 'types/Joanie';
import { LearnerDashboardSidebar } from 'widgets/Dashboard/components/LearnerDashboardSidebar';
import { useCourseProduct } from 'hooks/useCourseProducts';

export const DashboardOrderLayout = () => {
  const params = useParams<{ orderId: string }>();
  const order = useOmniscientOrder(params.orderId);
  const course = order.item?.course as CourseLight;
  const courseProduct = useCourseProduct({
    product_id: order.item?.product_id,
    course_id: course?.code,
  });
  const product = courseProduct?.item?.product;
  const intl = useIntl();
  const getRoutePath = getDashboardRoutePath(intl);
  const getRouteLabel = getDashboardRouteLabel(intl);

  const links = useMemo(
    () => [
      {
        to: getRoutePath(LearnerDashboardPaths.ORDER, { orderId: params.orderId }),
        label: getRouteLabel(LearnerDashboardPaths.ORDER_RUNS),
      },
    ],
    [],
  );

  return (
    <DashboardLayout
      className="dashboard-order-layout"
      sidebar={<LearnerDashboardSidebar menuLinks={links} title={product?.title} />}
    >
      <DashboardOrderLayoutContent product={product} />
    </DashboardLayout>
  );
};

const DashboardOrderLayoutContent = ({ product }: { product?: Product }) => {
  useBreadcrumbsPlaceholders({
    orderTitle: product?.title ?? '',
  });

  return <Outlet />;
};
