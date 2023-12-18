import { Contract } from 'types/Joanie';
import AbilitiesHelper from 'utils/AbilitiesHelper';

const useContractAbilities = (contracts: Contract | Contract[]) => {
  return AbilitiesHelper.buildEntityInterface(contracts);
};

export default useContractAbilities;
