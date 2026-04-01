import { useId } from 'react';
import { Button } from '@openfun/cunningham-react';
import { FormattedMessage, defineMessages } from 'react-intl';
import { Spinner } from 'components/Spinner';
import { useDownloadAgreement } from 'hooks/useDownloadAgreement';

const messages = defineMessages({
  download: {
    defaultMessage: 'Download agreement',
    description: 'Label for the button to download a signed agreement PDF',
    id: 'components.DownloadAgreementButton.download',
  },
  generating: {
    defaultMessage: 'Downloading...',
    description: 'Accessible label displayed while agreement PDF is being downloaded.',
    id: 'components.DownloadAgreementButton.generating',
  },
});

interface DownloadAgreementButtonProps {
  organizationId: string;
  agreementId: string;
}

const DownloadAgreementButton = ({ organizationId, agreementId }: DownloadAgreementButtonProps) => {
  const { download, loading } = useDownloadAgreement();
  const labelId = useId();

  return (
    <Button
      size="small"
      color="brand"
      variant="primary"
      className="dashboard-item__action-button"
      disabled={loading}
      onClick={() => download(organizationId, agreementId)}
    >
      {loading ? (
        <Spinner theme="primary" aria-labelledby={labelId}>
          <span id={labelId}>
            <FormattedMessage {...messages.generating} />
          </span>
        </Spinner>
      ) : (
        <FormattedMessage {...messages.download} />
      )}
    </Button>
  );
};

export default DownloadAgreementButton;
