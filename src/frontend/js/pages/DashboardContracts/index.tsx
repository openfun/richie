import { useEffect } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { Pagination, usePagination } from 'components/Pagination';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
import { DashboardItemContract } from 'widgets/Dashboard/components/DashboardItem/Contract';
import { useUserContracts } from 'hooks/useContracts';
import { NestedCredentialOrder } from 'types/Joanie';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading training contracts...',
    description: 'Message displayed while loading training contracts',
    id: 'components.DashboardContracts.loading',
  },
  empty: {
    defaultMessage: 'You have no training contract yet.',
    description: 'Message displayed when there are no training contracts',
    id: 'components.DashboardContracts.empty',
  },
});

export const DashboardContracts = () => {
  const intl = useIntl();
  const pagination = usePagination({});
  const {
    items: contracts,
    meta,
    states: { error, fetching },
  } = useUserContracts({
    page: pagination.currentPage,
    page_size: pagination.itemsPerPage,
  });
  const { pagination: contractPagination } = meta || {};
  const { count } = contractPagination || {};
  useEffect(() => {
    if (count) {
      pagination.setItemsCount(count);
    }
  }, [count]);

  if (error) {
    return <Banner message={error} type={BannerType.ERROR} />;
  }

  return (
    <div className="dashboard-contracts">
      {contracts.length === 0 && fetching ? (
        <Spinner aria-labelledby="loading-contract-data">
          <span id="loading-contract-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      ) : (
        <div>
          {contracts.length === 0 ? (
            <Banner message={intl.formatMessage(messages.empty)} type={BannerType.INFO} />
          ) : (
            <>
              <div className="dashboard-contracts__list">
                {contracts.map((contract) => (
                  <DashboardItemContract
                    key={`DashboardItemContract_${contract.id}`}
                    title={contract.order.product_title}
                    order={contract.order as NestedCredentialOrder}
                    contract_definition={contract.definition}
                    contract={contract}
                    writable={true}
                  />
                ))}
              </div>
              <Pagination {...pagination} />
            </>
          )}
        </div>
      )}
    </div>
  );
};
