import { connect } from 'react-redux';
import { Action, Dispatch } from 'redux';

import { ResourceListStateParams } from '../../data/genericReducers/resourceList/resourceList';
import { RootState } from '../../data/rootReducer';
import { API_LIST_DEFAULT_PARAMS } from '../../settings';
import { resourceBasedFilterGroupName } from '../../types/filters';
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
    addFilter: (
      modelName: resourceBasedFilterGroupName,
      filterValue: string,
    ) => {
      updateFilter(
        dispatch,
        currentParams,
        'add',
        filterDefinitions[modelName],
        filterValue,
      );
    },
  };
};

export const SearchSuggestFieldContainer = connect(
  mapStateToProps,
  null!,
  mergeProps,
)(SearchSuggestField);
