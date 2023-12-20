import { renderHook } from '@testing-library/react';
import useContractAbilities from 'hooks/useContractAbilities/index';
import { ContractFactory } from 'utils/test/factories/joanie';
import { ContractActions } from 'utils/AbilitiesHelper/types';

describe('useContractAbilities', () => {
  it.each([
    [[], false],
    [ContractFactory({ abilities: { [ContractActions.SIGN]: true } }).one(), true],
    [ContractFactory({ abilities: { [ContractActions.SIGN]: false } }).one(), false],
    [ContractFactory({ abilities: { [ContractActions.SIGN]: true } }).many(2), true],
    [
      [
        ContractFactory({ abilities: { [ContractActions.SIGN]: true } }).one(),
        ContractFactory({ abilities: { [ContractActions.SIGN]: false } }).one(),
      ],
      false,
    ],
  ])('should return ability interface to check contract abilities', (contracts, is_allowed) => {
    const { result } = renderHook(() => useContractAbilities(contracts));

    expect(result.current.can).toBeDefined();
    expect(result.current.cannot).toBeDefined();

    expect(result.current.can(ContractActions.SIGN)).toBe(is_allowed);
  });
});
