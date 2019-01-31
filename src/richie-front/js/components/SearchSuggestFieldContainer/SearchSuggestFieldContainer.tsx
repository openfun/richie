import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';

import { ResourceListStateParams } from '../../data/genericReducers/resourceList/resourceList';
import { getResourceList } from '../../data/genericSideEffects/getResourceList/actions';
import { pushQueryStringToHistory } from '../../data/genericSideEffects/pushHistoryState/actions';
import { RootState } from '../../data/rootReducer';
import { API_LIST_DEFAULT_PARAMS } from '../../settings';
import { filterGroupName } from '../../types/filters';
import { modelName } from '../../types/models';
import { updateFilter } from '../../utils/filters/updateFilter';
import { SearchSuggestField } from '../SearchSuggestField/SearchSuggestField';

export const mapStateToProps = (state: RootState) => ({
  currentParams:
    (state.resources.courses &&
      state.resources.courses.currentQuery &&
      state.resources.courses.currentQuery.params) ||
    API_LIST_DEFAULT_PARAMS,
  filterDefinitions: state.filterDefinitions,
});

export const mergeProps = (
  {
    currentParams,
    filterDefinitions,
  }: {
    currentParams: ResourceListStateParams;
    filterDefinitions: RootState['filterDefinitions'];
  },
  { dispatch }: { dispatch: Dispatch<Action> },
) => {
  return {
    // Add a single filter from a suggestion to the current search.
    addFilter: (filterName: filterGroupName, filterValue: string) => {
      updateFilter(
        dispatch,
        currentParams,
        'add',
        filterDefinitions[filterName],
        filterValue,
      );
    },
    // Update the full text search with the current value of the search field (default suggestion).
    fullTextSearch: (query: string) => {
      const newParams = { ...currentParams, query };
      // Make sure we update both the query/results and the URL query string
      dispatch(getResourceList(modelName.COURSES, newParams));
      dispatch(pushQueryStringToHistory(newParams));
    },
  };
};

export const SearchSuggestFieldContainer = connect(
  mapStateToProps,
  null!,
  mergeProps,
)(SearchSuggestField);
