import { defineMessages, FormattedMessage } from 'react-intl';
import { Button } from '@openfun/cunningham-react';
import { Spinner } from 'components/Spinner';
import type * as Joanie from 'types/Joanie';
import { useDownloadCertificate } from 'hooks/useDownloadCertificate';

const messages = defineMessages({
  certificateExplanation: {
    defaultMessage:
      'You will be able to download your certificate once you will pass all course runs.',
    description: 'Text displayed when the product certificate has no description',
    id: 'components.CourseProductCertificateItem.certificateExplanation',
  },
  congratulations: {
    defaultMessage: 'Congratulations, you passed this course!',
    description: 'Congratulation message when user has passed the course.',
    id: 'components.CourseProductCertificateItem.congratulations',
  },
  download: {
    defaultMessage: 'Download',
    description: 'Button label to download the certificate',
    id: 'components.CourseProductCertificateItem.download',
  },
  generatingCertificate: {
    defaultMessage: 'Certificate is being generated...',
    description: 'Accessible label displayed while certificate is being generated.',
    id: 'components.CourseProductCertificateItem.generatingCertificate',
  },
});

interface Props {
  certificateDefinition: Joanie.CertificateDefinition;
  order?: Joanie.OrderLite;
}

const CertificateItem = ({ certificateDefinition, order }: Props) => {
  const { download, loading } = useDownloadCertificate();

  const onDownloadClick = async () => {
    await download(order!.certificate_id!);
  };

  return (
    <li className="product-widget__item certificate">
      <svg className="certificate__icon" role="img" viewBox="0 0 25 34">
        <use href="#icon-certificate" />
      </svg>
      <div>
        <strong className="product-widget__item-title h5">{certificateDefinition.title}</strong>
        <p className="product-widget__item-description">
          {order?.certificate_id ? (
            <>
              <FormattedMessage {...messages.congratulations} />
              <Button disabled={loading} onClick={onDownloadClick}>
                {loading ? (
                  <Spinner theme="light" aria-labelledby="generating-certificate">
                    <span id="generating-certificate">
                      <FormattedMessage {...messages.generatingCertificate} />
                    </span>
                  </Spinner>
                ) : (
                  <FormattedMessage {...messages.download} />
                )}
              </Button>
            </>
          ) : (
            certificateDefinition.description || (
              <FormattedMessage {...messages.certificateExplanation} />
            )
          )}
        </p>
      </div>
    </li>
  );
};

export default CertificateItem;
