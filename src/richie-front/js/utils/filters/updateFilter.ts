import { Action, Dispatch } from 'redux';

import { ResourceListStateParams } from '../../data/genericReducers/resourceList/resourceList';
import { getResourceList } from '../../data/genericSideEffects/getResourceList/actions';
import { pushQueryStringToHistory } from '../../data/genericSideEffects/pushHistoryState/actions';
import { FilterDefinition } from '../../types/filters';
import { computeNewFilterValue } from './computeNewFilterValue';

// Update a search filter for our main Search view/state
// This helper is mostly glue (a lot of parameters and imports come together). In our opinion,
// this is useful as it handles the coordination cleanly in a single place, rather than
// have it duplicated in several connected components, and once in each component for each action it supports.
export const updateFilter = (
  dispatch: Dispatch<Action>,
  currentParams: ResourceListStateParams,
  action: 'add' | 'remove',
  filter: FilterDefinition,
  filterValue: string,
) => {
  // Use our other utils to build the new params from the existing state and filter information,
  // and the incoming filter value & definition
  const newParams = {
    ...currentParams,
    [filter.machineName]: computeNewFilterValue(
      currentParams[filter.machineName],
      {
        action,
        isDrilldown: !!filter.isDrilldown,
        payload: filterValue,
      },
    ),
  };
  // Make sure we update both the query/results and the URL query string
  dispatch(getResourceList('courses', newParams));
  dispatch(pushQueryStringToHistory(newParams));
};
