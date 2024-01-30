import { FormattedMessage, defineMessages } from 'react-intl';
import useDateFormat from 'hooks/useDateFormat';
import { Contract, ContractState } from 'types/Joanie';
import { ContractHelper } from 'utils/ContractHelper';

const messages = defineMessages({
  learnerSignedOn: {
    defaultMessage: 'You signed this training contract. Signed on {date}',
    description: 'Label for the date of sign of a training contract by the learner',
    id: 'components.ContractStatus.learnerSignedOn',
  },
  organizationSignedOn: {
    defaultMessage: 'The organization has signed this training contract. Signed on {date}',
    description: 'Label for the date of sign of a training contract by the organization',
    id: 'components.ContractStatus.organizationSignedOn',
  },
  waitingLearnerSignature: {
    defaultMessage: 'You have to sign this training contract to access your training.',
    description: 'Label displayed when a training contract need to be signed by the learner',
    id: 'components.ContractStatus.waitingSignature',
  },
  waitingOrganization: {
    defaultMessage:
      'You cannot download your training contract until it had been signed by the organization.',
    description: 'Label displayed when a training contract need to be signed by the organization',
    id: 'components.ContractStatus.waitingOrganization',
  },
});

export interface ContractStatusProps {
  contract?: Contract;
}
const ContractStatus = ({ contract }: ContractStatusProps) => {
  const { student_signed_on: studentSignedOn, organization_signed_on: organizationSignedOn } =
    contract || {};
  const state = ContractHelper.getState(contract);
  const formatDate = useDateFormat();

  return state === ContractState.UNSIGNED ? (
    <FormattedMessage {...messages.waitingLearnerSignature} />
  ) : (
    <>
      {[ContractState.SIGNED, ContractState.LEARNER_SIGNED].includes(state) && (
        <div>
          <FormattedMessage
            {...messages.learnerSignedOn}
            values={{ date: formatDate(studentSignedOn!) }}
          />
        </div>
      )}
      {state === ContractState.SIGNED ? (
        <div>
          <FormattedMessage
            {...messages.organizationSignedOn}
            values={{ date: formatDate(organizationSignedOn!) }}
          />
        </div>
      ) : (
        <div>
          <FormattedMessage {...messages.waitingOrganization} />
        </div>
      )}
    </>
  );
};

export default ContractStatus;
