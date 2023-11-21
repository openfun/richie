import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Button, Loader } from '@openfun/cunningham-react';
import { DashboardItem } from 'widgets/Dashboard/components/DashboardItem/index';
import { Contract, CredentialOrder, Product } from 'types/Joanie';
import { RouterButton } from 'widgets/Dashboard/components/RouterButton';
import { LearnerDashboardPaths } from 'widgets/Dashboard/utils/learnerRouteMessages';
import { getDashboardRoutePath } from 'widgets/Dashboard/utils/dashboardRoutes';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { alert } from 'utils/indirection/window';
import { handle } from 'utils/errors/handle';
import ContractStatus from 'components/ContractStatus';

const messages = defineMessages({
  contractSignActionLabel: {
    id: 'components.DashboardItemOrder.contractSignActionLabel',
    description: 'Label of "sign contract" action.',
    defaultMessage: 'Sign',
  },
  contractDownloadActionLabel: {
    id: 'components.DashboardItemOrder.contractDownloadActionLabel',
    description: 'Label of "download contract" action.',
    defaultMessage: 'Download',
  },
  contractDownloadError: {
    id: 'components.DashboardItemOrder.contractDownloadError',
    description: "Message displayed when the order's contract download fails.",
    defaultMessage: 'An error happened while downloading the contract. Please try again later.',
  },
});

export const DashboardItemOrderContractFooter = ({
  order,
  contract,
  onSign,
  loading,
  writable,
}: {
  order: CredentialOrder;
  contract?: Contract;
  mode?: 'default' | 'compact';
  onSign?: () => void;
  loading?: boolean;
  writable: boolean;
}) => {
  const getRoutePath = getDashboardRoutePath(useIntl());
  const api = useJoanieApi();
  const intl = useIntl();

  const downloadContract = async () => {
    try {
      const blob = await api.user.contracts.download(contract!.id);
      // eslint-disable-next-line compat/compat
      const file = window.URL.createObjectURL(blob);
      window.open(file);

      // eslint-disable-next-line compat/compat
      URL.revokeObjectURL(file);
    } catch (e) {
      handle(e);
      alert(intl.formatMessage(messages.contractDownloadError));
    }
  };

  const renderSignButton = () => {
    if (writable) {
      return (
        <Button className="dashboard-item__button" onClick={onSign} disabled={loading}>
          <FormattedMessage {...messages.contractSignActionLabel} />
        </Button>
      );
    }
    return (
      <RouterButton
        color="outline-primary"
        href={getRoutePath(LearnerDashboardPaths.ORDER, {
          orderId: order.id,
        })}
        className="dashboard-item__button"
      >
        <FormattedMessage {...messages.contractSignActionLabel} />
      </RouterButton>
    );
  };

  return (
    <div
      className="dashboard-item-order__footer"
      data-testid="dashboard-item-order-contract__footer"
    >
      <div className="dashboard-item__block__status">
        <ContractStatus contract={contract} />
      </div>
      {contract?.signed_on ? (
        <Button className="dashboard-item__button" color="secondary" onClick={downloadContract}>
          <FormattedMessage {...messages.contractDownloadActionLabel} />
        </Button>
      ) : (
        renderSignButton()
      )}
    </div>
  );
};

export const DashboardItemOrderContract = ({
  order,
  product,
  onSign,
  loading,
  writable,
}: {
  order: CredentialOrder;
  product: Product;
  writable: boolean;
  onSign?: () => void;
  loading?: boolean;
}) => {
  return (
    <div className="dashboard__contract-item" data-testid="dashboard-item-order-contract">
      <DashboardItem
        title={
          <>
            {loading && <Loader size="small" />}
            {product.contract_definition!.title}
          </>
        }
        code=""
        footer={
          <DashboardItemOrderContractFooter
            order={order}
            contract={order.contract}
            onSign={onSign}
            loading={loading}
            writable={writable}
          />
        }
      />
    </div>
  );
};
