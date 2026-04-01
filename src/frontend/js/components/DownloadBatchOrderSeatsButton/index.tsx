import { useId } from 'react';
import { Button } from '@openfun/cunningham-react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { Spinner } from 'components/Spinner';
import { useDownloadBatchOrderSeats } from 'hooks/useDownloadBatchOrderSeats';

const messages = defineMessages({
  download: {
    defaultMessage: 'Export CSV',
    description: 'Label for the button to export batch order seats as CSV',
    id: 'components.DownloadBatchOrderSeatsButton.download',
  },
  generating: {
    defaultMessage: 'Generating export...',
    description: 'Accessible label displayed while CSV export is being generated.',
    id: 'components.DownloadBatchOrderSeatsButton.generating',
  },
  seats: {
    defaultMessage: 'Seats',
    description: 'Text displayed for seats value in batch order',
    id: 'batchOrder.seats',
  },
});

export const sanitizeForFilename = (str: string) =>
  str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_');

export const buildFilename = (prefix: string, productTitle: string) => {
  const now = new Date();
  const date = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  const time = `${String(now.getUTCHours()).padStart(2, '0')}-${String(now.getUTCMinutes()).padStart(2, '0')}`;
  return `${prefix}_${sanitizeForFilename(productTitle)}_${date}_${time}.csv`;
};

interface DownloadBatchOrderSeatsButtonProps {
  batchOrderId: string;
  productTitle: string;
}

const DownloadBatchOrderSeatsButton = ({
  batchOrderId,
  productTitle,
}: DownloadBatchOrderSeatsButtonProps) => {
  const { download, loading } = useDownloadBatchOrderSeats();
  const labelId = useId();
  const intl = useIntl();

  const handleClick = () => {
    const prefix = intl.formatMessage(messages.seats);
    download(batchOrderId, buildFilename(prefix, productTitle));
  };

  return (
    <Button
      size="small"
      color="brand"
      variant="primary"
      className="dashboard-item__action-button"
      disabled={loading}
      onClick={handleClick}
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

export default DownloadBatchOrderSeatsButton;
