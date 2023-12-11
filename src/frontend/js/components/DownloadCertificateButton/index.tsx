import { Button } from '@openfun/cunningham-react';
import { FormattedMessage, defineMessages } from 'react-intl';
import { Spinner } from 'components/Spinner';
import { useDownloadCertificate } from 'hooks/useDownloadCertificate';
import { Certificate } from 'types/Joanie';

const messages = defineMessages({
  download: {
    defaultMessage: 'Download',
    description: 'Label for the download button of a certificate',
    id: 'components.DownloadCertificateButton.download',
  },
  generatingCertificate: {
    defaultMessage: 'Certificate is being generated...',
    description: 'Accessible label displayed while certificate is being generated.',
    id: 'components.DownloadCertificateButton.generatingCertificate',
  },
});

interface DownloadCertificateButtonProps {
  certificateId: Certificate['id'];
  className?: string;
}

const DownloadCertificateButton = ({
  certificateId,
  className,
}: DownloadCertificateButtonProps) => {
  const { download, loading } = useDownloadCertificate();
  const onDownloadClick = async () => {
    if (!certificateId) {
      return;
    }
    await download(certificateId);
  };

  return (
    <Button
      className={className}
      size="small"
      color="secondary"
      disabled={loading}
      onClick={onDownloadClick}
    >
      {loading ? (
        <Spinner theme="primary" aria-labelledby="generating-certificate">
          <span id="generating-certificate">
            <FormattedMessage {...messages.generatingCertificate} />
          </span>
        </Spinner>
      ) : (
        <FormattedMessage {...messages.download} />
      )}
    </Button>
  );
};

export default DownloadCertificateButton;
