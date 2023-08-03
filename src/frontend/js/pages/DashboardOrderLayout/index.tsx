import { Outlet, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useMemo } from 'react';
import {
  getDashboardRouteLabel,
  getDashboardRoutePath,
} from 'widgets/Dashboard/utils/dashboardRoutes';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { useOrder } from 'hooks/useOrders';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';
import { CourseLight, Product } from 'types/Joanie';
import { LearnerDashboardSidebar } from 'widgets/Dashboard/components/LearnerDashboardSidebar';
import { useCourseProduct } from 'hooks/useCourseProducts';

export const DashboardOrderLayout = () => {
  const params = useParams<{ orderId: string }>();
  const order = useOrder(params.orderId);
  const course = order.item?.course as CourseLight;
  const courseProduct = useCourseProduct(course?.code, { productId: order.item?.product });
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
    <DashboardLayout sidebar={<LearnerDashboardSidebar menuLinks={links} title={product?.title} />}>
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
