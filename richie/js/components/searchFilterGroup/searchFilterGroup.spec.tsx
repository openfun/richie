import '../../testSetup.spec';

import { shallow } from 'enzyme';
import * as React from 'react';

import { FilterDefinition } from '../../types/FilterDefinition';
import SearchFilter from '../searchFilter/searchFilter';
import SearchFilterGroup from './searchFilterGroup';

describe('components/searchFilterGroup', () => {
  it('renders the name of the filter', () => {
    const filter = {
      humanName: 'Example filter',
      machineName: 'example-filter',
      values: [],
    } as FilterDefinition;
    const wrapper = shallow(<SearchFilterGroup filter={filter} />);

    expect(wrapper.text()).toContain('Example filter');
  });

  it('renders the list of filter values into a list of SearchFilters', () => {
    const filter = {
      humanName: 'Example filter',
      values: [ { primaryKey: 'value-1', humanName: 'Value One' }, { primaryKey: 'value-2', humanName: 'Value Two' } ],
    } as FilterDefinition;
    const wrapper = shallow(<SearchFilterGroup filter={filter} />);

    expect(wrapper.find(SearchFilter).length).toEqual(2);
  });
});
