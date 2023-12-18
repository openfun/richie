import { Contract } from 'types/Joanie';
import { ContractActions } from './types';

type ContractAbilityList = {
  [action in ContractActions]: (entities: Contract) => boolean;
};

const abilities: ContractAbilityList = {
  [ContractActions.SIGN]: (contract: Contract) => {
    return contract?.abilities?.sign === true;
  },
};

export default abilities;
