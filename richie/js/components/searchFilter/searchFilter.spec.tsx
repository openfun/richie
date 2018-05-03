import '../../testSetup.spec';

import { shallow } from 'enzyme';
import * as React from 'react';

import SearchFilter from './searchFilter';

describe('components/searchFilter', () => {
  it('renders the name of the filter', () => {
    const addFilter = jasmine.createSpy('addFilter');
    const wrapper =
      shallow(<SearchFilter addFilter={addFilter} filter={{ primaryKey: '42', humanName: 'Human name'}} />);

    expect(wrapper.text()).toContain('Human name');
  });
});
