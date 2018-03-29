import { Reducer } from 'redux';

import Organization from '../../types/Organization';
import { OrganizationAdd } from './actions';

const initialState = {};

export interface OrganizationState {
  byId?: {
    [id: string]: Organization;
  };
}

export const organization: Reducer<OrganizationState> = (
  state: OrganizationState = initialState,
  action?: OrganizationAdd,
) => {
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
