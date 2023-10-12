import { JoanieUserProfile } from 'types/User';

export enum JoanieUserProfileActions {
  ACCESS_TEACHER_DASHBOARD = 'access_teacher_dahboard',
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

// further entities and entity actions can be add here
// like Entity = JoanieUserProfileEntity | CourseEntity
export type Entity = JoanieUserProfile;
export type Actions = JoanieUserProfileActions;
