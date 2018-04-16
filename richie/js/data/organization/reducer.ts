import flow from 'lodash-es/flow';
import get from 'lodash-es/get';
import partialRight from 'lodash-es/partialRight';
import { Reducer } from 'redux';

import Organization from '../../types/Organization';
import { ResourceAdd } from '../genericReducers/resourceById/actions';
import {
  byId,
  initialState as resourceByIdInit,
  ResourceByIdState,
} from '../genericReducers/resourceById/resourceById';

const initialState = { ...resourceByIdInit };

export type OrganizationState = ResourceByIdState<Organization>;

export const organization: Reducer<OrganizationState> = (
  state: OrganizationState = initialState,
  action?: ResourceAdd<Organization> | { type: '' },
) => {
  // Discriminate resource related actions by resource name
  if (get(action, 'resourceName') &&
      get(action, 'resourceName') !== 'organization'
  ) {
    return state;
  }

  return flow([ partialRight(byId, action) ])(state, action);
};

export default organization;
