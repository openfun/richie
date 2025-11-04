import { Agreement } from 'types/Joanie';
import { AgreementActions } from './types';

type AgreementAbilityList = {
  [action in AgreementActions]: (entities: Agreement) => boolean;
};

const abilities: AgreementAbilityList = {
  [AgreementActions.SIGN]: (agreement: Agreement) => {
    return agreement?.abilities?.sign === true;
  },
};

export default abilities;
