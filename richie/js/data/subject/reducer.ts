import flow from 'lodash-es/flow';
import get from 'lodash-es/get';
import partialRight from 'lodash-es/partialRight';
import { Reducer } from 'redux';

import Subject from '../../types/Subject';
import { ResourceAdd } from '../genericReducers/resourceById/actions';
import {
  byId,
  initialState as resourceByIdInit,
  ResourceByIdState,
} from '../genericReducers/resourceById/resourceById';

const initialState = { ...resourceByIdInit };

export type SubjectState = ResourceByIdState<Subject>;

export const subject: Reducer<SubjectState> = (
  state: SubjectState = initialState,
  action?: ResourceAdd<Subject> | { type: '' },
) => {
  // Discriminate resource related actions by resource name
  if (get(action, 'resourceName') &&
      get(action, 'resourceName') !== 'subject'
  ) {
    return state;
  }

  return flow([ partialRight(byId, action) ])(state, action);
};

export default subject;
