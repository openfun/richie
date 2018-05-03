import { connect, Dispatch } from 'react-redux';

import { filterGroupName, resourceBasedFilterGroupName } from '../../data/filterDefinitions/reducer';
import { ResourceListStateParams } from '../../data/genericReducers/resourceList/resourceList';
import { getResourceList } from '../../data/genericSideEffects/getResourceList/actions';
import { RootState } from '../../data/rootReducer';
import { API_LIST_DEFAULT_PARAMS as defaultParams } from '../../settings.json';
import { SearchFilterGroup, SearchFilterGroupProps} from '../searchFilterGroup/searchFilterGroup';
import { computeNewFilterValue } from './computeNewFilterValue';
import { getFilterFromState } from './getFilterFromState';

export interface SearchFilterGroupContainerProps {
  machineName: filterGroupName;
}

export const mapStateToProps = (state: RootState, { machineName }: SearchFilterGroupContainerProps) => ({
  currentParams: state.resources.courses &&
                 state.resources.courses.currentQuery &&
                 state.resources.courses.currentQuery.params || defaultParams,
  filter: getFilterFromState(state, machineName),
});

export const mergeProps = (
  { currentParams, filter }: { currentParams: ResourceListStateParams, filter: SearchFilterGroupProps['filter'] },
  { dispatch }: { dispatch: Dispatch<RootState> },
  { machineName }: SearchFilterGroupContainerProps,
) => ({
  addFilter: (filterValue: string) => dispatch(getResourceList('courses', {
    ...currentParams,
    [machineName]: filter.isDrilldown ?
      // Drilldown filters only support one value at a time
      filterValue :
      // For other filters use the standard computation
      computeNewFilterValue('add', currentParams[machineName], filterValue),
  })),
  filter,
  removeFilter: (filterValue: string) => dispatch(getResourceList('courses', {
    ...currentParams,
    [machineName]: filter.isDrilldown ?
      // Drilldown filters only support one value at a time
      (filterValue === currentParams[machineName] ?
        // Remove the value if it matches current value
        null :
        // Don't remove a non matching existing value
        currentParams[machineName] || null) :
      // For other filters use the standard computation
      computeNewFilterValue('remove', currentParams[machineName], filterValue),
  })),
});

export const SearchFilterGroupContainer = connect(mapStateToProps, null!, mergeProps)(SearchFilterGroup);

export default SearchFilterGroupContainer;
