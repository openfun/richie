import { JoanieUserApiAbilityActions, JoanieUserProfile } from 'types/User';
import { JoanieUserProfileActions } from './types';

type JoanieUserAbilityList = {
  [action in JoanieUserProfileActions]: (entity: JoanieUserProfile) => boolean;
};
const abilities: JoanieUserAbilityList = {
  [JoanieUserProfileActions.ACCESS_TEACHER_DASHBOARD]: (joanieUser: JoanieUserProfile) => {
    return (
      Boolean(joanieUser.abilities[JoanieUserApiAbilityActions.HAS_ORGANIZATION_ACCESS]) ||
      Boolean(joanieUser.abilities[JoanieUserApiAbilityActions.HAS_COURSE_ACCESS])
    );
  },
};

export default abilities;
