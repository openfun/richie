import { useEffect } from 'react';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { keepPreviousData } from '@tanstack/query-core';
import classNames from 'classnames';
import { Pagination, usePagination } from 'components/Pagination';
import { useCertificates } from 'hooks/useCertificates';
import { Spinner } from 'components/Spinner';
import Banner, { BannerType } from 'components/Banner';
import { DashboardItemCertificate } from 'widgets/Dashboard/components/DashboardItem/Certificate';
import { CertificateType } from 'types/Joanie';
import { PER_PAGE } from 'settings';

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

interface CertificatesListProps {
  certificateType: CertificateType;
}
const CertificatesList = ({ certificateType }: CertificatesListProps) => {
  const intl = useIntl();
  const pagination = usePagination({ itemsPerPage: PER_PAGE.certificateList });
  const certificates = useCertificates(
    {
      type: certificateType,
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

  if (certificates.states.error) {
    return <Banner message={certificates.states.error} type={BannerType.ERROR} />;
  }

  return (
    <div>
      {certificates.items.length === 0 && certificates.states.fetching ? (
        <Spinner aria-labelledby="loading-certificates-data">
          <span id="loading-certificates-data">
            <FormattedMessage {...messages.loading} />
          </span>
        </Spinner>
      ) : (
        certificates.items.length === 0 && (
          <Banner message={intl.formatMessage(messages.empty)} type={BannerType.INFO} />
        )
      )}

      {certificates.items.length > 0 && (
        <>
          <div
            className={classNames('dashboard-certificates__list', {
              'dashboard__list--loading': certificates.states.fetching,
            })}
          >
            {certificates.items.map((certificate) => (
              <DashboardItemCertificate key={certificate.id} certificate={certificate} />
            ))}
          </div>
          <Pagination {...pagination} />
        </>
      )}
    </div>
  );
};

export default CertificatesList;
