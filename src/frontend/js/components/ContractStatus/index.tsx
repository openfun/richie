import { FormattedMessage, defineMessages } from 'react-intl';
import useDateFormat from 'hooks/useDateFormat';
import { Contract } from 'types/Joanie';

const messages = defineMessages({
  signedOn: {
    defaultMessage: "You've accepted the training contract. Signed on {date}",
    description: 'Label for the date of sign of a contract',
    id: 'components.ContractStatus.signedOn',
  },
  waitingSignature: {
    defaultMessage: 'You have to sign this contract to access your training.',
    description: 'Label displayed when a contract need to be signed',
    id: 'components.ContractStatus.waitingSignature',
  },
});

export interface ContractStatusProps {
  contract?: Contract;
}
const ContractStatus = ({ contract }: ContractStatusProps) => {
  const { signed_on: signedOn } = contract || {};
  const formatDate = useDateFormat();

  return signedOn ? (
    <FormattedMessage {...messages.signedOn} values={{ date: formatDate(signedOn) }} />
  ) : (
    <FormattedMessage {...messages.waitingSignature} />
  );
};

export default ContractStatus;
