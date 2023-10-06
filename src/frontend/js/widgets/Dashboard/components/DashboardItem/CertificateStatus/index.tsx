import { FormattedMessage, MessageDescriptor, defineMessages } from 'react-intl';
import useDateFormat from 'hooks/useDateFormat';
import { Certificate, ProductType } from 'types/Joanie';

const messages = defineMessages({
  issuedOn: {
    defaultMessage: 'Issued on {date}',
    description: 'Label for the date of issue of a certificate',
    id: 'components.DashboardCertificate.issuedOn',
  },
  noCertificateCredential: {
    defaultMessage:
      'When all your courses have been passed, you will be able to download your certificate here.',
    description: 'Label displayed when no certificate credential is available',
    id: 'components.DashboardCertificate.noCertificateCredential',
  },
  noCertificateCertificate: {
    defaultMessage: 'When you pass your exam, you will be able to download your certificate here.',
    description: 'Label displayed when no certificate certificate is available',
    id: 'components.DashboardCertificate.noCertificateCertificate',
  },
  noCertificateUnknown: {
    defaultMessage:
      'When all requirements are met, you will be able to download your certificate here.',
    description:
      'Label displayed when we dont have the product type and no certificate is available',
    id: 'components.DashboardCertificate.noCertificateUnknown',
  },
});

export interface CertificateStatusProps {
  certificate?: Certificate;
  productType?: ProductType;
}
const CertificateStatus = ({ certificate, productType }: CertificateStatusProps) => {
  const getMessage = () => {
    const messagesByProductType: Record<ProductType, MessageDescriptor> = {
      [ProductType.CREDENTIAL]: messages.noCertificateCredential,
      [ProductType.CERTIFICATE]: messages.noCertificateCertificate,
    };

    if (!productType) {
      return messages.noCertificateUnknown;
    }

    return messagesByProductType[productType!];
  };
  const formatDate = useDateFormat();
  return certificate ? (
    <FormattedMessage
      {...messages.issuedOn}
      values={{ date: formatDate(certificate!.issued_on) }}
    />
  ) : (
    <FormattedMessage {...getMessage()} />
  );
};

export default CertificateStatus;
