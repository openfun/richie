import { Button } from '@openfun/cunningham-react';
import { FormattedMessage, defineMessages } from 'react-intl';
import { Spinner } from 'components/Spinner';
import { useDownloadBatchOrderSeats } from 'hooks/useDownloadBatchOrderSeats';

const messages = defineMessages({
  download: {
    defaultMessage: 'Export CSV',
    description: 'Label for the download button to export batch order seats as CSV',
    id: 'components.DownloadBatchOrderSeatsButton.download',
  },
  generating: {
    defaultMessage: 'Generating export...',
    description: 'Accessible label displayed while CSV export is being generated.',
    id: 'components.DownloadBatchOrderSeatsButton.generating',
  },
});

interface DownloadBatchOrderSeatsButtonProps {
  batchOrderId: string;
}

const DownloadBatchOrderSeatsButton = ({ batchOrderId }: DownloadBatchOrderSeatsButtonProps) => {
  const { download, loading } = useDownloadBatchOrderSeats();

  return (
    <Button
      size="small"
      color="brand"
      variant="secondary"
      className="dashboard-item__action-button"
      disabled={loading}
      onClick={() => download(batchOrderId)}
    >
      {loading ? (
        <Spinner theme="primary" aria-labelledby="generating-seats-export">
          <span id="generating-seats-export">
            <FormattedMessage {...messages.generating} />
          </span>
        </Spinner>
      ) : (
        <FormattedMessage {...messages.download} />
      )}
    </Button>
  );
};

export default DownloadBatchOrderSeatsButton;
