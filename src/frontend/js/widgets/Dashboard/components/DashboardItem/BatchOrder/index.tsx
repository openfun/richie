import { BatchOrder } from 'types/Joanie';
import { DashboardItem } from '../index';
import { defineMessages, FormattedMessage } from 'react-intl';
import { RouterButton } from '../../RouterButton';
import { generatePath } from 'react-router';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRoutesPaths';

interface DashboardItemBatchOrderProps {
  batchOrder: BatchOrder;
}

const messages = defineMessages({
  syllabusLinkLabel: {
    id: 'components.DashboardItemOrder.syllabusLinkLabel',
    description: 'Syllabus link label on order details',
    defaultMessage: 'View to batch order',
  },
});

export const DashboardItemBatchOrder = ({ batchOrder }: DashboardItemBatchOrderProps) => {
  const offering = batchOrder.offering;
  return (
    <div className="dashboard-item-order">
      <DashboardItem
        data-testid={`dashboard-item-batchorder-${batchOrder.id}`}
        title={`Course`}
        code={'Ref. ' + batchOrder.id}
        footer={
          <>
            <div className="dashboard-contract__body">
              toto
              <span>Number of seats : {batchOrder.nb_seats}</span>
            </div>
            <div className="dashboard-contract__footer">
              <span className="dashboard-contract__footer__status">
                Current state :{batchOrder.state}
              </span>
              <div>
                <RouterButton
                  size="small"
                  href={generatePath(LearnerDashboardPaths.BATCH_ORDER, {
                    batchOrderId: batchOrder.id!,
                  })}
                  className="dashboard-item__button"
                >
                  <FormattedMessage {...messages.syllabusLinkLabel} />
                </RouterButton>
              </div>
            </div>
          </>
        }
      />
    </div>
  );
};
