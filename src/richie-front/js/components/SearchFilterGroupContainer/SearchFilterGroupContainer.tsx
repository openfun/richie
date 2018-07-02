import partial from 'lodash-es/partial';
import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';

import { ResourceListStateParams } from '../../data/genericReducers/resourceList/resourceList';
import { RootState } from '../../data/rootReducer';
import { Settings } from '../../settings';
import settings from '../../settings.json';
import { filterGroupName, FilterValue } from '../../types/filters';
import { getActiveFilterValues } from '../../utils/filters/getActiveFilterValues';
import { getFilterFromState } from '../../utils/filters/getFilterFromState';
import { updateFilter } from '../../utils/filters/updateFilter';
import {
  SearchFilterGroup,
  SearchFilterGroupProps,
} from '../SearchFilterGroup/SearchFilterGroup';

const { API_LIST_DEFAULT_PARAMS } = settings as Settings;

export interface SearchFilterGroupContainerProps {
  machineName: filterGroupName;
}

export const mapStateToProps = (
  state: RootState,
  { machineName }: SearchFilterGroupContainerProps,
) => {
  const currentParams =
    (state.resources.courses &&
      state.resources.courses.currentQuery &&
      state.resources.courses.currentQuery.params) ||
    API_LIST_DEFAULT_PARAMS;

  return {
    activeFilterValues: getActiveFilterValues(
      state,
      machineName,
      currentParams,
    ),
    currentParams,
    filter: getFilterFromState(state, machineName),
  };
};

export const mergeProps = (
  {
    activeFilterValues,
    currentParams,
    filter,
  }: {
    activeFilterValues: FilterValue[];
    currentParams: ResourceListStateParams;
    filter: SearchFilterGroupProps['filter'];
  },
  { dispatch }: { dispatch: Dispatch<Action> },
  { machineName }: SearchFilterGroupContainerProps,
) => ({
  activeFilterValues,
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
