import { generatePath, Outlet, useParams } from 'react-router';
import { useIntl } from 'react-intl';
import { useMemo } from 'react';
import { getDashboardRouteLabel } from 'widgets/Dashboard/utils/dashboardRoutes';
import { DashboardLayout } from 'widgets/Dashboard/components/DashboardLayout';
import { useBreadcrumbsPlaceholders } from 'hooks/useBreadcrumbsPlaceholders';
import { BatchOrder, BatchOrderRead } from 'types/Joanie';
import { LearnerDashboardSidebar } from 'widgets/Dashboard/components/LearnerDashboardSidebar';

import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';
import { useBatchOrder } from 'hooks/useBatchOrder/useBatchOrder';

export const DashboardBatchOrderLayout = () => {
  const intl = useIntl();
  const getRouteLabel = getDashboardRouteLabel(intl);
  const params = useParams<{ batchOrderId: string }>();
  const { methods } = useBatchOrder();
  const { data } = methods.get(params.batchOrderId);
  const batchOrder = data as BatchOrderRead;

  const links = useMemo(
    () => [
      {
        to: generatePath(LearnerDashboardPaths.BATCH_ORDER, { batchOrderId: params.batchOrderId! }),
        label: getRouteLabel(LearnerDashboardPaths.ORDER_RUNS),
      },
    ],
    [],
  );

  return (
    <DashboardLayout
      className="dashboard-order-layout"
      sidebar={<LearnerDashboardSidebar menuLinks={links} title="toto" />}
    >
      <DashboardBatchOrderLayoutContent batchOrder={batchOrder} />
    </DashboardLayout>
  );
};

const DashboardBatchOrderLayoutContent = ({ batchOrder }: { batchOrder?: BatchOrderRead }) => {
  useBreadcrumbsPlaceholders({
    orderTitle: batchOrder?.id ?? '',
  });

  return <Outlet />;
};
