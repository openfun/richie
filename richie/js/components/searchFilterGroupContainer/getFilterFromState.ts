import values from 'lodash-es/values';

import { filterGroupName, resourceBasedFilterGroupName } from '../../data/filterDefinitions/reducer';
import { RootState } from '../../data/rootReducer';
import { FilterDefinition } from '../../types/FilterDefinition';

// Get (or build) a complete filter definition for `machineName` from the state, using:
// - filterDefinitions for hardcoded filters and hardcoded props of resource based filters
// - organizations & subjects for resource based filters
export function getFilterFromState(state: RootState, machineName: filterGroupName): FilterDefinition {
  // Default to empty object as it is the default value for currentQuery.facets
  const facets = state.resources.courses &&
                 state.resources.courses.currentQuery &&
                 state.resources.courses.currentQuery.facets || {};

  switch (machineName) {
    // Use the facets to build the values for resource based filters
    case 'organizations':
    case 'subjects':
      return {
        ...state.filterDefinitions[machineName],
        values: getFacetedValues(state, facets, machineName),
      };

    // Values from state are usable as-is for hardcoded filters
    default:
      return state.filterDefinitions[machineName];
  }

  /* tslint:disable:variable-name */
  function getFacetedValues(
    state_: typeof state,
    facets_: typeof facets,
    resourceName: resourceBasedFilterGroupName,
  ) {
    if (!state.resources[resourceName]) { return []; }

    // We don't have the facets yet or something broke upstream: provide some filtering
    // capabilities anyway (without counts, as we can't generate those)
    if (!facets_[resourceName] || !Object.keys(facets_[resourceName]).length) {
      return values(state.resources[resourceName]!.byId || {})
        .map((organization) => ({
          humanName: organization.name,
          primaryKey: String(organization.id),
        }));
    }

    return Object.keys(facets_[resourceName])
      .map((resourceId) => ({
        // Facet current query by this resource id (count)
        count: facets[resourceName][resourceId],
        // Get the resource name from the state
        humanName: state.resources[resourceName]!.byId[resourceId].name,
        // resourceId is already a string as it was a key on the facets.organization object
        primaryKey: resourceId,
      }))
      // Sort by highest count first
      .sort((filterValueA, filterValueB) => filterValueA.count > filterValueB.count && -1 ||
                                            filterValueB.count > filterValueA.count && 1 ||
                                            0,
      );
  }
  /* tslint:enable */
}

export default getFilterFromState;
