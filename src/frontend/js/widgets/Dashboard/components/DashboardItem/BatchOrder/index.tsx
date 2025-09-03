import { BatchOrder } from 'types/Joanie';
import { DashboardItem } from '../index';
import { defineMessages, FormattedMessage } from 'react-intl';

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
  return (
    <div className="dashboard-item-order">
      <DashboardItem
        data-testid={`dashboard-item-batchorder-${batchOrder.id}`}
        title={`Batch order`}
        code={'Ref. ' + batchOrder.id}
        more={
          <li>
            <a className="selector__list__link" href={`/redirects/batch-orders/${batchOrder.id}`}>
              <FormattedMessage {...messages.syllabusLinkLabel} />
            </a>
          </li>
        }
        footer={
          <div className="dashboard-item-order__footer">
            <span>Number of seats : {batchOrder.nb_seats}</span>
            <span>Payment method : {batchOrder.payment_method}</span>
            <span>Offering : {batchOrder.offering_id}</span>
          </div>
        }
      />
    </div>
  );
};
