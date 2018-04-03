import values from 'lodash-es/values';
import { connect } from 'react-redux';

import { RootState } from '../../data/rootReducer';
import FilterDefinition from '../../types/FilterDefinition';
import SearchFilterGroup from '../searchFilterGroup/searchFilterGroup';

export interface SearchFilterGroupContainerProps {
  machineName: string;
}

// Some of our filters are hardcoded and do not rely on any external data
const hardcodedFilters: { [machineName: string]: FilterDefinition; } = {
  language: {
    humanName: 'Language',
    machineName: 'language',
    values: [
      [ 'en', 'English' ],
      [ 'fr', 'French' ],
    ],
  },

  new: {
    humanName: 'New courses',
    machineName: 'status',
    values: [
      [ 'new', 'First session' ],
    ],
  },

  status: {
    humanName: 'Availability',
    isDrilldown: true,
    machineName: 'availability',
    values: [
      [ 'coming_soon', 'Coming soon' ],
      [ 'current', 'Current session' ],
      [ 'open', 'Open, no session' ],
    ],
  },
};

// Some filters need to be derived from the data
const getFilterFromData = (state: RootState, machineName: string) => {
  switch (machineName) {
    case 'organization':
      return {
        humanName: 'Organizations',
        machineName,
        values: values(state[machineName].byId).map((organization) => [ String(organization.id), organization.name ]),
      };

    case 'subject':
      return {
        humanName: 'Subjects',
        machineName,
        values: values(state[machineName].byId).map((subject) => [ String(subject.id), subject.name ]),
      };
  }
};

const mapStateToProps = (state: RootState, { machineName }: SearchFilterGroupContainerProps) => {
  return { filter: hardcodedFilters[machineName] || getFilterFromData(state, machineName) };
};

export const SearchFilterGroupContainer = connect(mapStateToProps)(SearchFilterGroup);

export default SearchFilterGroupContainer;
