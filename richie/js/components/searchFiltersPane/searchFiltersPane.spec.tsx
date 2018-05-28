import '../../testSetup.spec';

import { shallow } from 'enzyme';
import * as React from 'react';

import { SearchFilterGroupContainer } from '../searchFilterGroupContainer/searchFilterGroupContainer';
import { SearchFiltersPane } from './searchFiltersPane';

describe('components/searchFiltersPane', () => {
  it('renders all our search filter group containers', () => {
    const wrapper = shallow(<SearchFiltersPane />);

    expect(wrapper.text()).toContain('Filter results');
    expect(wrapper.find(SearchFilterGroupContainer).length).toEqual(5);
  });
});
