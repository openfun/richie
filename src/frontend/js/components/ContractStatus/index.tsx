import { FormattedMessage, defineMessages } from 'react-intl';
import useDateFormat from 'hooks/useDateFormat';
import { Contract, ContractState } from 'types/Joanie';
import { ContractHelper } from 'utils/ContractHelper';

const messages = defineMessages({
  signedOn: {
    defaultMessage: 'You signed this training contract. Signed on {date}',
    description: 'Label for the date of sign of a contract',
    id: 'components.ContractStatus.signedOn',
  },
  waitingSignature: {
    defaultMessage: 'You have to sign this training contract to access your training.',
    description: 'Label displayed when a contract need to be signed',
    id: 'components.ContractStatus.waitingSignature',
  },
});

export interface ContractStatusProps {
  contract?: Contract;
}
const ContractStatus = ({ contract }: ContractStatusProps) => {
  const state = ContractHelper.getState(contract);
  const formatDate = useDateFormat();

  if (!state || state === ContractState.UNSIGNED) {
    return <FormattedMessage {...messages.waitingSignature} />;
  }

  return (
    <FormattedMessage
      {...messages.signedOn}
      values={{ date: formatDate(contract!.student_signed_on!) }}
    />
  );
};

export default ContractStatus;
