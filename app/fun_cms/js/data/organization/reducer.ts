import { Reducer } from 'redux';

import { ORGANIZATION_ADD } from './actions';
import Organization from '../../types/Organization';

const initialState = {};

export type organizationState = {
  byId?: {
    [id: string]: Organization;
  };
}

export const organization: Reducer<organizationState> = (state: organizationState = initialState, action?: ORGANIZATION_ADD) => {
  switch (action && action.type) {
    case 'ORGANIZATION_ADD':
      return {
        ...state,
        byId: {
          ...state.byId,
          [action.organization.id]: action.organization,
        },
      };
  }

  return state;
};

export default organization;
