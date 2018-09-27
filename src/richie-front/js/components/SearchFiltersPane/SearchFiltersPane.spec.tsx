import '../../testSetup';

import { shallow } from 'enzyme';
import * as React from 'react';

import { SearchFilterGroupContainer } from '../SearchFilterGroupContainer/SearchFilterGroupContainer';
import { SearchFiltersPane } from './SearchFiltersPane';

describe('components/SearchFiltersPane', () => {
  it('renders all our search filter group containers', () => {
    const wrapper = shallow(<SearchFiltersPane />);

    expect(wrapper.text()).toContain('Filter results');
    expect(wrapper.find(SearchFilterGroupContainer).length).toEqual(5);
  });
});
