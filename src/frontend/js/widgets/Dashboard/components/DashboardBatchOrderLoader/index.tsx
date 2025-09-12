import { useParams } from 'react-router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Spinner } from 'components/Spinner';
import { useBatchOrder } from 'hooks/useBatchOrder/useBatchOrder';
import { DashboardItemBatchOrder } from '../DashboardItem/BatchOrder';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading order ...',
    description: 'Message displayed while loading an order',
    id: 'components.DashboardOrderLoader.loading',
  },
});

export const DashboardBatchOrderLoader = () => {
  const params = useParams<{ batchOrderId: string }>();
  const { item: batchOrder, states } = useBatchOrder(params.batchOrderId);
  const fetching = states.isPending;

  return (
    <>
      {fetching && !batchOrder && (
        <Spinner aria-labelledby="loading-courses-data">
          <span id="loading-courses-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      )}
      {batchOrder && <DashboardItemBatchOrder batchOrder={batchOrder} showDetails />}
    </>
  );
};
