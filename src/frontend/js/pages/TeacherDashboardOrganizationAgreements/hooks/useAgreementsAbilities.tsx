import { Agreement } from 'types/Joanie';
import AbilitiesHelper from 'utils/AbilitiesHelper';

const useAgreementAbilities = (agreements?: Agreement | Agreement[]) => {
  return AbilitiesHelper.buildEntityInterface(agreements);
};

export default useAgreementAbilities;
