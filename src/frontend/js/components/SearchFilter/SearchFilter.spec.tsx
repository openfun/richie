import '../../testSetup';

import { render, shallow } from 'enzyme';
import * as React from 'react';

import { SearchFilter } from './SearchFilter';

describe('components/SearchFilter', () => {
  let addFilter: jasmine.Spy;
  let removeFilter: jasmine.Spy;

  beforeEach(() => {
    addFilter = jasmine.createSpy('addFilter');
    removeFilter = jasmine.createSpy('removeFilter');
  });

  it('renders the name of the filter (passed as a message)', () => {
    const wrapper = render(
      <SearchFilter
        addFilter={addFilter}
        filter={{
          humanName: { defaultMessage: 'Human name', id: 'humanName' },
          primaryKey: '42',
        }}
        isActive={false}
        removeFilter={removeFilter}
      />,
    );

    expect(wrapper.text()).toContain('Human name');
  });

  it('renders the name of the filter (passed as a string)', () => {
    const wrapper = render(
      <SearchFilter
        addFilter={addFilter}
        filter={{
          humanName: 'Hooman name',
          primaryKey: '42',
        }}
        isActive={false}
        removeFilter={removeFilter}
      />,
    );

    expect(wrapper.text()).toContain('Hooman name');
  });
  it('calls addFilter on button click if it was not active', () => {
    const wrapper = shallow(
      <SearchFilter
        addFilter={addFilter!}
        filter={{
          humanName: { defaultMessage: 'Human name', id: 'humanName' },
          primaryKey: '42',
        }}
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
        filter={{
          humanName: { defaultMessage: 'Human name', id: 'humanName' },
          primaryKey: '43',
        }}
        isActive={true}
        removeFilter={removeFilter}
      />,
    );
    wrapper.find('button').simulate('click');

    expect(removeFilter).toHaveBeenCalledWith('43');
    expect(addFilter).not.toHaveBeenCalled();
  });
});
