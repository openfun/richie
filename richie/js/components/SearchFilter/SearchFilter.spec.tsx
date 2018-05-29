import '../../testSetup.spec';

import { shallow } from 'enzyme';
import * as React from 'react';

import { SearchFilter } from './SearchFilter';

describe('components/SearchFilter', () => {
  let addFilter: jasmine.Spy;
  let removeFilter: jasmine.Spy;

  beforeEach(() => {
    addFilter = jasmine.createSpy('addFilter');
    removeFilter = jasmine.createSpy('removeFilter');
  });

  it('renders the name of the filter', () => {
    const wrapper = shallow(
      <SearchFilter
        addFilter={addFilter}
        filter={{ primaryKey: '42', humanName: 'Human name' }}
        isActive={false}
        removeFilter={removeFilter}
      />,
    );

    expect(wrapper.text()).toContain('Human name');
  });

  it('calls addFilter on button click if it was not active', () => {
    const wrapper = shallow(
      <SearchFilter
        addFilter={addFilter!}
        filter={{ primaryKey: '42', humanName: 'Human name' }}
        isActive={false}
        removeFilter={removeFilter}
      />,
    );
    wrapper.find('button').simulate('click');

    expect(addFilter).toHaveBeenCalledWith('42');
    expect(removeFilter).not.toHaveBeenCalled();
  });

  it('calls removeFilter on button click if it was active', () => {
    const wrapper = shallow(
      <SearchFilter
        addFilter={addFilter!}
        filter={{ primaryKey: '43', humanName: 'Human name' }}
        isActive={true}
        removeFilter={removeFilter}
      />,
    );
    wrapper.find('button').simulate('click');

    expect(removeFilter).toHaveBeenCalledWith('43');
    expect(addFilter).not.toHaveBeenCalled();
  });
});
