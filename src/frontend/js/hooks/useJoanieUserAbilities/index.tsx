import { isJoanieEnabled } from 'api/joanie';
import { useJoanieUserProfile } from 'hooks/useJoanieUserProfile';
import AbilitiesHelper from 'utils/AbilitiesHelper';

export const useJoanieUserAbilities = () => {
  if (isJoanieEnabled) {
    const { item: joanieUserProfile } = useJoanieUserProfile();
    return joanieUserProfile ? AbilitiesHelper.buildEntityInterface(joanieUserProfile) : undefined;
  }
  return undefined;
};
