import { createIntl } from 'react-intl';
import { ContractFactory } from 'utils/test/factories/joanie';
import { ContractState } from 'types/Joanie';
import { ContractHelper, ContractStatePoV } from '.';

const unsignedContractFactory = ContractFactory({
  student_signed_on: undefined,
  organization_signed_on: undefined,
});
const halfSignedContractFactory = ContractFactory({
  student_signed_on: Date.toString(),
  organization_signed_on: undefined,
});
const signedContractFactory = ContractFactory({
  student_signed_on: Date.toString(),
  organization_signed_on: Date.toString(),
});

describe('ContractHelper', () => {
  describe('getState', () => {
    it.each([
      [null, ContractState.UNSIGNED],
      [undefined, ContractState.UNSIGNED],
      [unsignedContractFactory.one(), ContractState.UNSIGNED],
      [halfSignedContractFactory.one(), ContractState.LEARNER_SIGNED],
      [signedContractFactory.one(), ContractState.SIGNED],
    ])('should return the correct state', (contract, state) => {
      expect(ContractHelper.getState(contract)).toEqual(state);
    });
  });

  describe('getStateLabel', () => {
    const intl = createIntl({ locale: 'en' });

    it.each([
      [ContractStatePoV.LEARNER, ContractState.UNSIGNED, 'Pending for signature'],
      [
        ContractStatePoV.LEARNER,
        ContractState.LEARNER_SIGNED,
        'Pending for organization signature',
      ],
      [ContractStatePoV.LEARNER, ContractState.SIGNED, 'Signed'],
      [ContractStatePoV.ORGANIZATION, ContractState.UNSIGNED, 'Pending for learner signature'],
      [ContractStatePoV.ORGANIZATION, ContractState.LEARNER_SIGNED, 'Pending for signature'],
      [ContractStatePoV.ORGANIZATION, ContractState.SIGNED, 'Signed'],
    ])('should return the correct state', (pov, state, label) => {
      expect(ContractHelper.getStateLabel(state, pov, intl)).toEqual(label);
    });
  });

  describe('getHumanReadableState', () => {
    const intl = createIntl({ locale: 'en' });

    it.each([
      [ContractStatePoV.LEARNER, unsignedContractFactory.one(), 'Pending for signature'],
      [
        ContractStatePoV.LEARNER,
        halfSignedContractFactory.one(),
        'Pending for organization signature',
      ],
      [ContractStatePoV.LEARNER, signedContractFactory.one(), 'Signed'],
      [
        ContractStatePoV.ORGANIZATION,
        unsignedContractFactory.one(),
        'Pending for learner signature',
      ],
      [ContractStatePoV.ORGANIZATION, halfSignedContractFactory.one(), 'Pending for signature'],
      [ContractStatePoV.ORGANIZATION, signedContractFactory.one(), 'Signed'],
    ])('should return the correct state', (pov, contract, label) => {
      expect(ContractHelper.getHumanReadableState(contract, pov, intl)).toEqual(label);
    });
  });
});
