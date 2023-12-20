import { Maybe, Nullable } from 'types/utils';
import contractAbilities from 'utils/AbilitiesHelper/contractAbilities';
import joanieUserProfileAbilities from './joanieUserProfileAbilities';
import {
  Entity,
  Actions,
  JoanieUserProfileActions,
  isJoanieUserProfileEntity,
  isContractEntity,
  ContractActions,
} from './types';

// further actions can be added here
// like: { ...JoanieUserProfileActions, ...CourseActions };
export const abilityActions = { ...JoanieUserProfileActions, ...ContractActions };

/**
 * Check if an action is available on an entity
 * Joanie's backend give us an "abilities" entry for several models like user, course and organization
 * these "api abilities" are used to define our "frontend abilities"
 *
 * @param entities - The entities on which we want to check action's availability.
 * @param action - The action to check.
 */
const can = (entities: Maybe<Nullable<Entity | Entity[]>>, action: Actions) => {
  if (!entities) return false;

  if (!Array.isArray(entities)) entities = [entities];
  else if (entities.length === 0) return false;

  return entities.every((entity) => {
    if (isJoanieUserProfileEntity(entity)) {
      return joanieUserProfileAbilities[action as JoanieUserProfileActions](entity);
    }

    if (isContractEntity(entity)) {
      return contractAbilities[action as ContractActions](entity);
    }

    return false;
  });

  // further abilities can be added here
  // example:
  // if (isCourseEntity(entity)) {
  //   return courseAbilities[action](entity);
  // }
};

/**
 * Check if an action is NOT available on an entity
 *
 * @param entities - The entities on which we want to check action's availability.
 * @param action - The action to check.
 */
const cannot = (entities: Maybe<Nullable<Entity | Entity[]>>, action: Actions) => {
  return !can(entities, action);
};

const buildEntityInterface = (entities: Maybe<Nullable<Entity | Entity[]>>) => {
  return {
    can: (action: Actions) => can(entities, action),
    cannot: (action: Actions) => cannot(entities, action),
  };
};

export default {
  can,
  cannot,
  buildEntityInterface,
};
