import { useEffect } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { keepPreviousData } from '@tanstack/query-core';
import { Pagination, usePagination } from 'components/Pagination';
import { useCertificates } from 'hooks/useCertificates';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
import { DashboardItemCertificate } from 'widgets/Dashboard/components/DashboardItem/Certificate';

const messages = defineMessages({
  loading: {
    defaultMessage: 'Loading certificates...',
    description: 'Message displayed while loading certificates',
    id: 'components.DashboardCertificates.loading',
  },
  empty: {
    defaultMessage: 'You have no certificates yet.',
    description: 'Message displayed when there are no certificates',
    id: 'components.DashboardCertificates.empty',
  },
});

export const DashboardCertificates = () => {
  const intl = useIntl();
  const pagination = usePagination({});
  const certificates = useCertificates(
    {
      page: pagination.currentPage,
      page_size: pagination.itemsPerPage,
    },
    { placeholderData: keepPreviousData },
  );
  useEffect(() => {
    if (certificates.meta?.pagination?.count) {
      pagination.setItemsCount(certificates.meta.pagination.count);
    }
  }, [certificates.meta?.pagination?.count]);

  return (
    <div className="dashboard-certificates">
      {certificates.states.error && (
        <Banner message={certificates.states.error} type={BannerType.ERROR} />
      )}
      {certificates.items.length === 0 && certificates.states.fetching ? (
        <Spinner aria-labelledby="loading-certificates-data">
          <span id="loading-certificates-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      ) : (
        <div>
          {certificates.items.length === 0 ? (
            <Banner message={intl.formatMessage(messages.empty)} type={BannerType.INFO} />
          ) : (
            <>
              <div
                className={[
                  'dashboard-certificates__list',
                  certificates.states.fetching ? 'dashboard__list--loading' : '',
                ].join(' ')}
              >
                {certificates.items.map((certificate) => (
                  <DashboardItemCertificate key={certificate.id} certificate={certificate} />
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
