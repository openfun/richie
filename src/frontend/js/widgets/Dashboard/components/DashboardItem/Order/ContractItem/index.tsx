import { defineMessages, FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import { CredentialOrder, Product } from 'types/Joanie';
import { OrderHelper } from 'utils/OrderHelper';
import ContractStatus from 'components/ContractStatus';
import SignContractButton from 'components/SignContractButton';

const messages = defineMessages({
  trainingContractTitle: {
    id: 'components.DashboardItemOrder.ContractItem.trainingContractTitle',
    description: 'Title of the training contract section',
    defaultMessage: 'Training contract',
  },
});

const ContractItem = ({ order, product }: { order: CredentialOrder; product: Product }) => {
  if (!product?.contract_definition) {
    return;
  }

  const needsSignature = OrderHelper.orderNeedsSignature(order);
  return (
    <div
      id="dashboard-item-contract"
      className="dashboard-splitted-card__item"
      data-testid={`dashboard-item-contract-${order.id}`}
    >
      <div
        className={classNames('dashboard-splitted-card__item__title', {
          'dashboard-splitted-card__item__title--dot': needsSignature,
        })}
      >
        <span>
          <FormattedMessage {...messages.trainingContractTitle} />
        </span>
      </div>
      <div className="dashboard-splitted-card__item__description">
        <ContractStatus contract={order.contract} />
      </div>
      <div className="dashboard-splitted-card__item__actions">
        <SignContractButton
          order={order}
          contract={order.contract}
          writable={true}
          className="dashboard-item__button"
        />
      </div>
    </div>
  );
};

export default ContractItem;
