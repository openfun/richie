import { faker } from '@faker-js/faker';
import { ContractFactory } from 'utils/test/factories/joanie';
import { ContractActions } from 'utils/AbilitiesHelper/types';
import AbilitiesHelper from '.';

describe('Abilities.contractAbilities', () => {
  it('should allow or not user to sign contract according to contract abilities', () => {
    const contract = ContractFactory({
      abilities: {
        sign: faker.datatype.boolean(),
      },
    }).one();

    expect(AbilitiesHelper.can(contract, ContractActions.SIGN)).toBe(contract.abilities?.sign);
    expect(AbilitiesHelper.cannot(contract, ContractActions.SIGN)).toBe(!contract.abilities?.sign);
  });

  it('should allow or not user to sign contracts list according to contract abilities', () => {
    const signableContracts = ContractFactory({
      abilities: { sign: true },
    }).many(3);
    const unsignableContract = ContractFactory({
      abilities: { sign: false },
    }).one();

    // We should be able to pass an array of contracts and process ability according to all
    // contracts abilities provided
    expect(AbilitiesHelper.can(signableContracts, ContractActions.SIGN)).toBe(true);

    // If at least one contract is not allowed, user not be able to sign
    expect(
      AbilitiesHelper.can([...signableContracts, unsignableContract], ContractActions.SIGN),
    ).toBe(false);
  });
});
