import flow from 'lodash-es/flow';
import get from 'lodash-es/get';
import partialRight from 'lodash-es/partialRight';
import { Reducer } from 'redux';

import Subject from '../../types/Subject';
import { Maybe } from '../../utils/types';
import { ResourceAdd } from '../genericReducers/resourceById/actions';
import {
  byId,
  initialState as resourceByIdInit,
  ResourceByIdState,
} from '../genericReducers/resourceById/resourceById';
import { currentQuery, ResourceListState } from '../genericReducers/resourceList/resourceList';
import { ResourceListGetSuccess } from '../genericSideEffects/getResourceList/actions';

const initialState = { ...resourceByIdInit };

export type SubjectState = Maybe<ResourceByIdState<Subject> & ResourceListState<Subject>>;

export const subject: Reducer<SubjectState> = (
  state = initialState,
  action?: ResourceAdd<Subject> | ResourceListGetSuccess<Subject> | { type: '' },
) => {
  if (!action) { return state; } // Compiler needs help

  // Discriminate resource related actions by resource name
  if (get(action, 'resourceName') &&
      get(action, 'resourceName') !== 'subject'
  ) {
    return state;
  }

  return flow([
    partialRight(byId, action),
    partialRight(currentQuery, action),
  ])(state, action);
};

export default subject;
