import { Maybe, Nullable } from 'types/utils';
import joanieUserProfileAbilities from './joanieUserProfileAbilities';
import { Entity, Actions, JoanieUserProfileActions, isJoanieUserProfileEntity } from './types';

// further actions can be add here
// like: { ...JoanieUserProfileActions, ...CourseActions };
export const abilityActions = { ...JoanieUserProfileActions };

/**
 * Check if an action is available on an entity
 * Joanie's backend give us an "abilities" entry for several models like user, course and organization
 * these "api abilities" are used to define our "frontend abilities"
 *
 * @param entity - The entity on which we want to check action's availability.
 * @param action - The action to check.
 */
const can = (entity: Maybe<Nullable<Entity>>, action: Actions) => {
  if (!entity) {
    return false;
  }

  if (isJoanieUserProfileEntity(entity)) {
    return !!joanieUserProfileAbilities[action](entity);
  }

  // further abilities can be add here
  // example:
  // if (isCourseEntity(entity)) {
  //   return courseAbilities[action](entity);
  // }
};

/**
 * Check if an action is NOT available on an entity
 *
 * @param entity - The entity on which we want to check action's availability.
 * @param action - The action to check.
 */
const cannot = (entity: Maybe<Nullable<Entity>>, action: Actions) => {
  return !can(entity, action);
};

const buildEntityInterface = (entity: Maybe<Nullable<Entity>>) => {
  return {
    can: (action: Actions) => can(entity, action),
    cannot: (action: Actions) => cannot(entity, action),
  };
};

export default {
  can,
  cannot,
  buildEntityInterface,
};
