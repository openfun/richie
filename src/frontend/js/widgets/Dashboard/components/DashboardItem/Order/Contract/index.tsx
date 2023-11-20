import { DashboardItem } from 'widgets/Dashboard/components/DashboardItem/index';
import { Contract, CredentialOrder, Product } from 'types/Joanie';
import ContractStatus from 'components/ContractStatus';
import SignContractButton from 'components/SignContractButton';

interface DashboardItemOrderContractFooterProps {
  order: CredentialOrder;
  contract?: Contract;
  writable: boolean;
}

export const DashboardItemOrderContractFooter = ({
  order,
  contract,
  writable,
}: DashboardItemOrderContractFooterProps) => {
  return (
    <div
      className="dashboard-item-order__footer"
      data-testid="dashboard-item-order-contract__footer"
    >
      <div className="dashboard-item__block__status">
        <ContractStatus contract={contract} />
      </div>

      <SignContractButton
        order={order}
        contract={contract}
        writable={writable}
        className="dashboard-item__button"
      />
    </div>
  );
};

export const DashboardItemOrderContract = ({
  order,
  product,
  writable,
}: {
  order: CredentialOrder;
  product: Product;
  writable: boolean;
}) => {
  return (
    <div className="dashboard__contract-item" data-testid="dashboard-item-order-contract">
      <DashboardItem
        title={product.contract_definition!.title}
        code=""
        footer={
          <DashboardItemOrderContractFooter
            order={order}
            contract={order.contract}
            writable={writable}
          />
        }
      />
    </div>
  );
};
