import flow from 'lodash-es/flow';
import get from 'lodash-es/get';
import partialRight from 'lodash-es/partialRight';
import { Reducer } from 'redux';

import { Category } from '../../types/Category';
import { modelName } from '../../types/models';
import { Maybe } from '../../utils/types';
import { ResourceAdd } from '../genericReducers/resourceById/actions';
import {
  byId,
  initialState as resourceByIdInit,
  ResourceByIdState,
} from '../genericReducers/resourceById/resourceById';
import {
  currentQuery,
  ResourceListState,
} from '../genericReducers/resourceList/resourceList';
import { ResourceListGetSuccess } from '../genericSideEffects/getResourceList/actions';

const initialState = { ...resourceByIdInit };

export type CategoriesState = Maybe<
  ResourceByIdState<Category> & ResourceListState<Category>
>;

export const categories: Reducer<CategoriesState> = (
  state = initialState,
  action?:
    | ResourceAdd<Category>
    | ResourceListGetSuccess<Category>
    | { type: '' },
) => {
  if (!action) {
    return state;
  } // Compiler needs help

  // Discriminate resource related actions by resource name
  if (
    get(action, 'resourceName') &&
    get(action, 'resourceName') !== modelName.CATEGORIES
  ) {
    return state;
  }

  return flow([partialRight(byId, action), partialRight(currentQuery, action)])(
    state,
    action,
  );
};
