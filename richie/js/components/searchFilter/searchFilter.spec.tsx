import '../../testSetup.spec';

import { shallow } from 'enzyme';
import * as React from 'react';

import SearchFilter from './searchFilter';

describe('components/searchFilter', () => {
  it('renders the name of the filter', () => {
    const wrapper = shallow(<SearchFilter filter={{ primaryKey: '42', humanName: 'Human name'}} />);

    expect(wrapper.text()).toContain('Human name');
  });
});
