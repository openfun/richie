import { ResourceListStateParams } from '../../data/genericReducers/resourceList/resourceList';
import { RootState } from '../../data/rootReducer';
import {
  filterGroupName,
  FilterValue,
  hardcodedFilterGroupName,
  resourceBasedFilterGroupName,
} from '../../types/filters';

// Return the list of *currenly active* filter values for a dimension built from the state & current params
export const getActiveFilterValues = (
  state: RootState,
  machineName: filterGroupName,
  currentParams: ResourceListStateParams,
): FilterValue[] => {
  let currentValues = currentParams[machineName];

  if (!currentValues) {
    return [];
  }

  // Wrap base typed values in arrays to make manipulating them easier
  if (typeof currentValues === 'string' || typeof currentValues === 'number') {
    currentValues = [currentValues];
  }

  switch (machineName) {
    case 'organizations':
    case 'subjects':
      return (
        currentValues
          // Get the value for each our the keys we received
          .map(
            key =>
              state.resources &&
              state.resources[machineName] &&
              state.resources[machineName]!.byId[key],
          )
          // Drop missing values (avoid throwing)
          .filter(value => !!value)
          // Build filter values from the Resource instances
          .map(value => ({
            humanName: value!.name,
            primaryKey: String(value!.id),
          }))
      );
    default:
      return currentValues
        .map(key => {
          return state.filterDefinitions[machineName].values.find(
            value => value.primaryKey === key,
          );
        })
        .filter(value => !!value)
        .map(value => ({
          humanName: value!.humanName,
          primaryKey: value!.primaryKey,
        }));
  }
};
