import '../../testSetup.spec';

import { shallow } from 'enzyme';
import * as React from 'react';

import { FilterDefinition } from '../../types/filters';
import SearchFilter from '../searchFilter/searchFilter';
import SearchFilterGroup from './searchFilterGroup';

describe('components/searchFilterGroup', () => {
  const addFilter = jasmine.createSpy('addFilter');
  const removeFilter = jasmine.createSpy('removeFilter');

  it('renders the name of the filter', () => {
    const filter = {
      humanName: 'Organizations',
      machineName: 'organizations',
      values: [],
    } as FilterDefinition;
    const wrapper = shallow(
      <SearchFilterGroup
        addFilter={addFilter}
        currentValue={undefined}
        filter={filter}
        removeFilter={removeFilter}
      />,
    );

    expect(wrapper.text()).toContain('Organizations');
  });

  it('renders the list of filter values into a list of SearchFilters', () => {
    const filter = {
      humanName: 'Example filter',
      values: [
        { primaryKey: 'value-1', humanName: 'Value One' },
        { primaryKey: 'value-2', humanName: 'Value Two' },
      ],
    } as FilterDefinition;
    const wrapper = shallow(
      <SearchFilterGroup
        addFilter={addFilter}
        currentValue={undefined}
        filter={filter}
        removeFilter={removeFilter}
      />,
    );

    expect(wrapper.find(SearchFilter).length).toEqual(2);
  });

  it('orders the list by putting active filters at the top', () => {
    const filter = {
      humanName: 'Example filter',
      values: [
        { primaryKey: 'value-1', humanName: 'Value One' },
        { primaryKey: 'value-2', humanName: 'Value Two' },
        { primaryKey: 'value-3', humanName: 'Value Three' },
      ],
    } as FilterDefinition;
    const wrapper = shallow(
      <SearchFilterGroup
        addFilter={addFilter}
        currentValue={'value-2'}
        filter={filter}
        removeFilter={removeFilter}
      />,
    );

    expect(
      wrapper
        .find(SearchFilter)
        .at(0)
        .shallow()
        .text(),
    ).toContain('Value Two');
    expect(
      wrapper
        .find(SearchFilter)
        .at(1)
        .shallow()
        .text(),
    ).toContain('Value One');
    expect(
      wrapper
        .find(SearchFilter)
        .at(2)
        .shallow()
        .text(),
    ).toContain('Value Three');
  });
});
