import partial from 'lodash-es/partial';
import { connect, Dispatch } from 'react-redux';
import { Action } from 'redux';

import { ResourceListStateParams } from '../../data/genericReducers/resourceList/resourceList';
import { RootState } from '../../data/rootReducer';
import { API_LIST_DEFAULT_PARAMS as defaultParams } from '../../settings.json';
import { filterGroupName } from '../../types/filters';
import { getFilterFromState } from '../../utils/filters/getFilterFromState';
import { updateFilter } from '../../utils/filters/updateFilter';
import {
  SearchFilterGroup,
  SearchFilterGroupProps,
} from '../SearchFilterGroup/SearchFilterGroup';

export interface SearchFilterGroupContainerProps {
  machineName: filterGroupName;
}

export const mapStateToProps = (
  state: RootState,
  { machineName }: SearchFilterGroupContainerProps,
) => ({
  currentParams:
    (state.resources.courses &&
      state.resources.courses.currentQuery &&
      state.resources.courses.currentQuery.params) ||
    defaultParams,
  filter: getFilterFromState(state, machineName),
});

export const mergeProps = (
  {
    currentParams,
    filter,
  }: {
    currentParams: ResourceListStateParams;
    filter: SearchFilterGroupProps['filter'];
  },
  { dispatch }: { dispatch: Dispatch<Action> },
  { machineName }: SearchFilterGroupContainerProps,
) => ({
  addFilter: partial(updateFilter, dispatch, currentParams, 'add', filter),
  currentValue: currentParams[filter.machineName],
  filter,
  removeFilter: partial(
    updateFilter,
    dispatch,
    currentParams,
    'remove',
    filter,
  ),
});

export const SearchFilterGroupContainer = connect(
  mapStateToProps,
  null!,
  mergeProps,
)(SearchFilterGroup);
