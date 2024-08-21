import { defineMessages, FormattedMessage } from 'react-intl';
import { CredentialOrder, Product } from 'types/Joanie';
import { DashboardItemCertificate } from 'widgets/Dashboard/components/DashboardItem/Certificate';
import { useCertificate } from 'hooks/useCertificates';
import { Spinner } from 'components/Spinner';

const messages = defineMessages({
  loadingCertificate: {
    id: 'components.DashboardItemOrder.CertificateItem.loadingCertificate',
    description: 'Accessible label displayed while certificate is being fetched on the dashboard.',
    defaultMessage: 'Loading certificate...',
  },
});

interface DashboardItemOrderCertificateProps {
  order: CredentialOrder;
  product: Product;
}

const CertificateItem = ({ order, product }: DashboardItemOrderCertificateProps) => {
  if (!order.certificate_id) {
    return (
      <DashboardItemCertificate
        certificateDefinition={product.certificate_definition}
        productType={product.type}
        mode="compact"
      />
    );
  }
  const certificate = useCertificate(order.certificate_id);
  return (
    <>
      {certificate.states.fetching && (
        <Spinner aria-labelledby="loading-certificate">
          <span id="loading-certificate">
            <FormattedMessage {...messages.loadingCertificate} />
          </span>
        </Spinner>
      )}
      {certificate.item && (
        <DashboardItemCertificate
          certificate={certificate.item}
          productType={product.type}
          mode="compact"
        />
      )}
    </>
  );
};

export default CertificateItem;
