import { JoanieUserProfile } from 'types/User';
import { Contract } from 'types/Joanie';

export enum JoanieUserProfileActions {
  ACCESS_TEACHER_DASHBOARD = 'access_teacher_dashboard',
}

export enum ContractActions {
  SIGN = 'sign',
}

const JOANIE_PROFILE_KEYS = [
  'abilities',
  'full_name',
  'id',
  'is_staff',
  'is_superuser',
  'username',
];

export const isJoanieUserProfileEntity = (entity: Entity): entity is JoanieUserProfile => {
  const entityKeys = Object.keys(entity);

  if (entityKeys.length !== JOANIE_PROFILE_KEYS.length) return false;
  return entityKeys.every((key) => JOANIE_PROFILE_KEYS.includes(key));
};

export const isContractEntity = (entity: Entity): entity is Contract => {
  const CONTRACT_KEYS = ['student_signed_on', 'organization_signed_on', 'definition', 'order'];
  return CONTRACT_KEYS.every((key) => entity.hasOwnProperty(key));
};

// further entities and entity actions can be added here
// like Entity = JoanieUserProfileEntity | CourseEntity
export type Entity = JoanieUserProfile | Contract;
export type Actions = JoanieUserProfileActions | ContractActions;
