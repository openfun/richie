import { connect } from 'react-redux';
import values from 'lodash-es/values';

import SearchFilterGroup from '../searchFilterGroup/searchFilterGroup';
import { rootState } from '../../data/rootReducer';
import FilterDefinition from '../../types/FilterDefinition';

export interface SearchFilterGroupContainerProps {
  machineName: string;
}

// Some of our filters are hardcoded and do not rely on any external data
const hardcodedFilters: { [machineName: string]: FilterDefinition; } = {
  language: {
    human_name: 'Language',
    machine_name: 'language',
    values: [
      [ 'en', 'English' ],
      [ 'fr', 'French' ],
    ],
  },

  new: {
    human_name: 'New courses',
    machine_name: 'status',
    values: [
      [ 'new', 'First session' ],
    ],
  },

  status: {
    human_name: 'Availability',
    is_drilldown: true,
    machine_name: 'availability',
    values: [
      [ 'coming_soon', 'Coming soon' ],
      [ 'current', 'Current session' ],
      [ 'open', 'Open, no session' ]
    ],
  },
};

// Some filters need to be derived from the data
const getFilterFromData = (state: rootState, machine_name: string) => {
  switch (machine_name) {
    case 'organization':
      return {
        human_name: 'Organizations',
        machine_name,
        values: values(state[machine_name].byId).map(organization => [ organization.code, organization.name ]),
      };

    case 'subject':
      return {
        human_name: 'Subjects',
        machine_name,
        values: values(state[machine_name].byId).map(subject => [ subject.code, subject.name ]),
      }
  }
}

const mapStateToProps = (state: rootState, { machineName }: SearchFilterGroupContainerProps) => {
  return { filter: hardcodedFilters[machineName] || getFilterFromData(state, machineName) };
};

export const SearchFilterGroupContainer = connect(mapStateToProps)(SearchFilterGroup);

export default SearchFilterGroupContainer;
