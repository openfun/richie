import { connect, Dispatch } from 'react-redux';
import { Action } from 'redux';

import { ResourceListStateParams } from '../../data/genericReducers/resourceList/resourceList';
import { getResourceList } from '../../data/genericSideEffects/getResourceList/actions';
import { pushQueryStringToHistory } from '../../data/genericSideEffects/pushHistoryState/actions';
import { RootState } from '../../data/rootReducer';
import { API_LIST_DEFAULT_PARAMS as defaultParams } from '../../settings.json';
import {
  filterGroupName,
  resourceBasedFilterGroupName,
} from '../../types/filters';
import { getFilterFromState } from '../../utils/filters/getFilterFromState';
import {
  SearchFilterGroup,
  SearchFilterGroupProps,
} from '../searchFilterGroup/searchFilterGroup';
import { computeNewFilterValue } from './computeNewFilterValue';

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
  addFilter: (filterValue: string) => {
    const newParams = {
      ...currentParams,
      [machineName]: filter.isDrilldown
        ? // Drilldown filters only support one value at a time
          filterValue
        : // For other filters use the standard computation
          computeNewFilterValue('add', currentParams[machineName], filterValue),
    };
    dispatch(getResourceList('courses', newParams));
    dispatch(pushQueryStringToHistory(newParams));
  },
  currentValue: currentParams[filter.machineName],
  filter,
  removeFilter: (filterValue: string) => {
    const newParams = {
      ...currentParams,
      [machineName]: filter.isDrilldown
        ? // Drilldown filters only support one value at a time
          filterValue === currentParams[machineName]
          ? // Remove the value if it matches current value
            undefined
          : // Don't remove a non matching existing value
            currentParams[machineName] || undefined
        : // For other filters use the standard computation
          computeNewFilterValue(
            'remove',
            currentParams[machineName],
            filterValue,
          ),
    };
    dispatch(getResourceList('courses', newParams));
    dispatch(pushQueryStringToHistory(newParams));
  },
});

export const SearchFilterGroupContainer = connect(
  mapStateToProps,
  null!,
  mergeProps,
)(SearchFilterGroup);

export default SearchFilterGroupContainer;
