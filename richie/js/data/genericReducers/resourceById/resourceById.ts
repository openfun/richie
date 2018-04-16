import { Reducer } from 'redux';

import Resource from '../../../types/Resource';
import { ResourceAdd } from './actions';

export const initialState = {
  byId: {},
};

export interface ResourceByIdState<R extends Resource> {
  byId: {
    [id: string]: R;
  };
}

export function byId<R extends Resource>(
  state: ResourceByIdState<R>,
  action: ResourceAdd<R> | { type: '' },
): ResourceByIdState<R> {
  // Initialize the state to an empty version of itself
  if (!state) { state = initialState; }
  if (!action) { return state; } // Compiler needs help

  switch (action.type) {
    // Add a single record to our state
    case 'RESOURCE_ADD':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.resource.id]: action.resource,
        },
      };
  }

  return state;
}

export default byId;
