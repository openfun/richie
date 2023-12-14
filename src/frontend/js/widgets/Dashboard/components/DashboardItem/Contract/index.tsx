import { Icon, IconTypeEnum } from 'components/Icon';
import { Contract, ContractDefinition, CredentialOrder, NestedCredentialOrder } from 'types/Joanie';
import ContractStatus from 'components/ContractStatus';
import SignContractButton from 'components/SignContractButton';
import { DashboardItem, DashboardItemProps } from '..';

interface DashboardItemContractProps {
  title: string;
  order: CredentialOrder | NestedCredentialOrder;
  contract_definition: ContractDefinition;
  contract?: Contract;
  writable: boolean;
  mode?: DashboardItemProps['mode'];
}
export const DashboardItemContract = ({
  title,
  order,
  contract,
  contract_definition,
  writable,
  mode,
}: DashboardItemContractProps) => {
  return (
    <DashboardItem
      data-testid={`dashboard-item-contract-${order.id}`}
      mode={mode}
      title={title}
      code={`Ref. ${order.course.code}`}
      imageFile={order.course.cover}
      footer={
        <>
          <div className="dashboard-contract__body">
            <Icon name={IconTypeEnum.UNIVERSITY} />
            <span>{contract_definition.title}</span>
          </div>
          <div className="dashboard-contract__footer">
            <span className="dashboard-contract__footer__status">
              <ContractStatus contract={contract} />
            </span>
            <div>
              <SignContractButton
                order={order}
                contract={contract}
                writable={writable}
                className="dashboard-item__button"
              />
            </div>
          </div>
        </>
      }
    />
  );
};
