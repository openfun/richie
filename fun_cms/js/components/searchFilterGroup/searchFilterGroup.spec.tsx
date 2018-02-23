import '../../testSetup.spec';

import { shallow } from 'enzyme';
import * as React from 'react';

import FilterDefinition from '../../types/FilterDefinition';
import SearchFilter from '../searchFilter/searchFilter';
import SearchFilterGroup from './searchFilterGroup';

describe('components/searchFilterGroup', () => {
  it('renders the name of the filter', () => {
    const filter = {
      humanName: 'Example filter',
      values: [],
    } as FilterDefinition;
    const wrapper = shallow(<SearchFilterGroup filter={filter} />);

    expect(wrapper.text()).toContain('Example filter');
  });

  it('renders the list of filter values into a list of SearchFilters', () => {
    const filter = {
      humanName: 'Example filter',
      values: [ [ 'value-1' ], [ 'value-2' ] ],
    } as FilterDefinition;
    const wrapper = shallow(<SearchFilterGroup filter={filter} />);

    expect(wrapper.find(SearchFilter).length).toEqual(2);
  });
});
