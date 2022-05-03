import { useState } from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';
import { Spinner } from 'components/Spinner';
import { useJoanieApi } from 'data/JoanieApiProvider';
import type * as Joanie from 'types/Joanie';
import { handle } from 'utils/errors/handle';

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
  certificate: Joanie.CertificateDefinition;
  order?: Joanie.OrderLite;
}

const CertificateItem = ({ certificate, order }: Props) => {
  const [loading, setLoading] = useState(false);
  const API = useJoanieApi();
  const downloadCertificate = async () => {
    try {
      setLoading(true);
      const $link = document.createElement('a');
      const certificateId = order!.certificate!;
      const file = await API.user.certificates.download(certificateId);
      // eslint-disable-next-line compat/compat
      const url = URL.createObjectURL(file);
      $link.href = url;
      $link.download = '';

      const revokeObject = () => {
        // eslint-disable-next-line compat/compat
        URL.revokeObjectURL(url);
        window.removeEventListener('blur', revokeObject);
      };

      window.addEventListener('blur', revokeObject);
      $link.click();
    } catch (error) {
      handle(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <li className="product-widget__item certificate">
      <svg className="certificate__icon" role="img" viewBox="0 0 25 34">
        <use href="#icon-certificate" />
      </svg>
      <div>
        <h5 className="product-widget__item-title">{certificate.title}</h5>
        <p className="product-widget__item-description">
          {order?.certificate ? (
            <>
              <FormattedMessage {...messages.congratulations} />
              <button
                disabled={loading}
                className="button button--primary button--pill"
                onClick={downloadCertificate}
              >
                {loading ? (
                  <Spinner theme="light" aria-labelledby="generating-certificate">
                    <span id="generating-certificate">
                      <FormattedMessage {...messages.generatingCertificate} />
                    </span>
                  </Spinner>
                ) : (
                  <FormattedMessage {...messages.download} />
                )}
              </button>
            </>
          ) : (
            certificate.description || <FormattedMessage {...messages.certificateExplanation} />
          )}
        </p>
      </div>
    </li>
  );
};

export default CertificateItem;
