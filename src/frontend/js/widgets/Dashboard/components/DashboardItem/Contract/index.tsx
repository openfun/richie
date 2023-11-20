import { Icon, IconTypeEnum } from 'components/Icon';
import { Contract, isNestedCredentialOrder } from 'types/Joanie';
import ContractStatus from 'components/ContractStatus';
import { DashboardItem } from 'widgets/Dashboard/components/DashboardItem/index';
import DownloadContractButton from 'components/DownloadContractButton';
import SignContractButton from 'components/SignContractButton';

interface DashboardItemContractProps {
  contract: Contract;
}
export const DashboardItemContract = ({ contract }: DashboardItemContractProps) => {
  if (!isNestedCredentialOrder(contract.order)) {
    return null;
  }

  return (
    <DashboardItem
      title={contract.order.product_title}
      code={`Ref. ${contract.order.course.code}`}
      imageFile={contract.order.course.cover}
      footer={
        <>
          <div className="dashboard-contract__body">
            <Icon name={IconTypeEnum.UNIVERSITY} />
            <span>{contract.definition.title}</span>
          </div>
          <div className="dashboard-contract__footer">
            <span>
              <ContractStatus contract={contract} />
            </span>
            <div>
              {contract.student_signed_on ? (
                <DownloadContractButton contract={contract} />
              ) : (
                <SignContractButton
                  order={contract.order}
                  contract={contract}
                  writable={true}
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
