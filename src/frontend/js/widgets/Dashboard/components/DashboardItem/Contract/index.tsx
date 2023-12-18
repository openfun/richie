import { Icon, IconTypeEnum } from 'components/Icon';
import { Contract, ContractDefinition, CredentialOrder, NestedCredentialOrder } from 'types/Joanie';
import ContractStatus from 'components/ContractStatus';
import { DashboardItem } from 'widgets/Dashboard/components/DashboardItem/index';
import DownloadContractButton from 'components/DownloadContractButton';
import SignContractButton from 'components/SignContractButton';

interface DashboardItemContractProps {
  title: string;
  order: CredentialOrder | NestedCredentialOrder;
  contract_definition: ContractDefinition;
  contract?: Contract;
  writable: boolean;
}
export const DashboardItemContract = ({
  title,
  order,
  contract,
  contract_definition,
  writable,
}: DashboardItemContractProps) => {
  return (
    <DashboardItem
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
            <span>
              <ContractStatus contract={contract} />
            </span>
            <div>
              {contract && contract.student_signed_on ? (
                <DownloadContractButton contract={contract} />
              ) : (
                <SignContractButton
                  order={order}
                  contract={contract}
                  writable={writable}
                  className="dashboard-item__button"
                />
              )}
            </div>
          </div>
        </>
      }
    />
  );
};
