import values from 'lodash-es/values';
import { connect } from 'react-redux';

import { RootState } from '../../data/rootReducer';
import { FilterDefinition } from '../../types/FilterDefinition';
import SearchFilterGroup from '../searchFilterGroup/searchFilterGroup';

export interface SearchFilterGroupContainerProps {
  machineName: filterGroups;
}

type resourceBasedFilterGroups = 'organization' | 'subject';
type hardcodedFilterGroups = 'language' | 'new' | 'status';
export type filterGroups = resourceBasedFilterGroups | hardcodedFilterGroups;

// Some of our filters are hardcoded and do not rely on any external data
const hardcodedFilters: { [machineName in hardcodedFilterGroups]: FilterDefinition; } = {
  language: {
    humanName: 'Language',
    machineName: 'language',
    values: [
      { primaryKey: 'en', humanName: 'English' },
      { primaryKey: 'fr', humanName: 'French' },
    ],
  },

  new: {
    humanName: 'New courses',
    machineName: 'status',
    values: [
      { primaryKey: 'new', humanName: 'First session'},
    ],
  },

  status: {
    humanName: 'Availability',
    isDrilldown: true,
    machineName: 'availability',
    values: [
      { primaryKey: 'coming_soon', humanName: 'Coming soon' },
      { primaryKey: 'current', humanName: 'Current session' },
      { primaryKey: 'open', humanName: 'Open, no session' },
    ],
  },
};

// Some filters need to be derived from the data
function getFilterFromData(state: RootState, machineName: filterGroups): FilterDefinition {
  // Default to empty object as it is the default value for currentQuery.facets
  const facets = state.resources.course &&
                 state.resources.course.currentQuery &&
                 state.resources.course.currentQuery.facets || {};

  switch (machineName) {
    case 'organization':
      return {
        humanName: 'Organizations',
        machineName,
        values: getFacetedValues(state, facets, machineName),
      };

    case 'subject':
      return {
        humanName: 'Subjects',
        machineName,
        values: getFacetedValues(state, facets, machineName),
      };

    default:
      return hardcodedFilters[machineName];
  }

    /* tslint:disable:variable-name */
  function getFacetedValues(
    state_: typeof state,
    facets_: typeof facets,
    resourceName: resourceBasedFilterGroups,
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

export const mapStateToProps = (state: RootState, { machineName }: SearchFilterGroupContainerProps) => {
  return { filter: getFilterFromData(state, machineName) };
};

export const SearchFilterGroupContainer = connect(mapStateToProps)(SearchFilterGroup);

export default SearchFilterGroupContainer;
