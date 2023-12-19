import { defineMessages, IntlShape } from 'react-intl';
import { Contract, ContractState } from 'types/Joanie';
import { StringHelper } from 'utils/StringHelper';
import { Maybe, Nullable } from 'types/utils';

const messages = defineMessages({
  organizationUnsigned: {
    id: 'utils.ContractHelper.organizationUnsigned',
    description: 'Label for unsigned contract status in organization point of view',
    defaultMessage: 'Pending for learner signature',
  },
  organizationHalfSigned: {
    id: 'utils.ContractHelper.organizationHalfSigned',
    description: 'Label for half signed contract status in organization point of view',
    defaultMessage: 'Pending for signature',
  },
  organizationSigned: {
    id: 'utils.ContractHelper.organizationSigned',
    description: 'Label for signed contract status in organization point of view',
    defaultMessage: 'Signed',
  },
  learnerUnsigned: {
    id: 'utils.ContractHelper.learnerUnsigned',
    description: 'Label for unsigned contract status in learner point of view',
    defaultMessage: 'Pending for signature',
  },
  learnerHalfSigned: {
    id: 'utils.ContractHelper.learnerHalfSigned',
    description: 'Label for unsigned contract status in learner point of view',
    defaultMessage: 'Pending for organization signature',
  },
  learnerSigned: {
    id: 'utils.ContractHelper.learnerSigned',
    description: 'Label for signed contract status in learner point of view',
    defaultMessage: 'Signed',
  },
});

export enum ContractStatePoV {
  LEARNER = 'learner',
  ORGANIZATION = 'organization',
}

export class ContractHelper {
  static getState(contract: Maybe<Nullable<Contract>>): ContractState {
    if (contract?.student_signed_on && contract?.organization_signed_on) {
      return ContractState.SIGNED;
    }

    if (contract?.student_signed_on) {
      return ContractState.LEARNER_SIGNED;
    }

    return ContractState.UNSIGNED;
  }

  static getStateLabel(state: ContractState, pov: ContractStatePoV, intl: IntlShape) {
    const camelCasedState = state
      .toLowerCase()
      .split('_')
      .map(StringHelper.capitalizeFirst)
      .join('');
    const messageKey = `${pov}${camelCasedState}` as keyof typeof messages;
    const message = messages[messageKey];

    return intl.formatMessage(message);
  }
  static getHumanReadableState(contract: Contract, pov: ContractStatePoV, intl: IntlShape) {
    const state = this.getState(contract);
    return this.getStateLabel(state, pov, intl);
  }
}
