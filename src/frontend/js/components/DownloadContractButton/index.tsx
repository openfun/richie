import { Button } from '@openfun/cunningham-react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { useJoanieApi } from 'contexts/JoanieApiContext';
import { handle } from 'utils/errors/handle';
import { Contract } from 'types/Joanie';
import { alert } from 'utils/indirection/window';

const messages = defineMessages({
  contractDownloadActionLabel: {
    id: 'components.DownloadContractButton.contractDownloadActionLabel',
    description: 'Label of "download contract" action.',
    defaultMessage: 'Download',
  },
  contractDownloadError: {
    id: 'components.DownloadContractButton.contractDownloadError',
    description: "Message displayed when the order's contract download fails.",
    defaultMessage:
      'An error happened while downloading the training contract. Please try again later.',
  },
});

interface DownloadContractButtonProps {
  contract: Contract;
  className?: string;
}

const DownloadContractButton = ({ contract, className }: DownloadContractButtonProps) => {
  const api = useJoanieApi();
  const intl = useIntl();

  const downloadContract = async () => {
    try {
      const blob = await api.user.contracts.download(contract!.id);
      // eslint-disable-next-line compat/compat
      const file = window.URL.createObjectURL(blob);
      window.open(file);

      // eslint-disable-next-line compat/compat
      URL.revokeObjectURL(file);
    } catch (e) {
      handle(e);
      alert(intl.formatMessage(messages.contractDownloadError));
    }
  };

  return (
    <Button size="small" className={className} color="secondary" onClick={downloadContract}>
      <FormattedMessage {...messages.contractDownloadActionLabel} />
    </Button>
  );
};

export default DownloadContractButton;
