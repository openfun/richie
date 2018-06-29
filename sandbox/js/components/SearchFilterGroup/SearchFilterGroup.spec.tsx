import '../../testSetup.spec';

import { shallow } from 'enzyme';
import * as React from 'react';

import { FilterDefinitionWithValues } from '../../types/filters';
import { SearchFilter } from '../SearchFilter/SearchFilter';
import { SearchFilterGroup } from './SearchFilterGroup';

describe('components/SearchFilterGroup', () => {
  const addFilter = jasmine.createSpy('addFilter');
  const removeFilter = jasmine.createSpy('removeFilter');

  it('renders the name of the filter', () => {
    const filter = {
      humanName: 'Organizations',
      machineName: 'organizations',
      values: [],
    } as FilterDefinitionWithValues;
    const wrapper = shallow(
      <SearchFilterGroup
        activeFilterValues={[]}
        addFilter={addFilter}
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
    } as FilterDefinitionWithValues;
    const wrapper = shallow(
      <SearchFilterGroup
        activeFilterValues={[]}
        addFilter={addFilter}
        filter={filter}
        removeFilter={removeFilter}
      />,
    );

    expect(wrapper.find(SearchFilter).length).toEqual(2);
  });

  it('renders any active filter values at the top of the list', () => {
    const activeFilterValues = [
      { primaryKey: 'value-2', humanName: 'Value Two' },
    ];
    const filter = {
      humanName: 'Example filter',
      values: [
        { primaryKey: 'value-1', humanName: 'Value One' },
        { primaryKey: 'value-3', humanName: 'Value Three' },
      ],
    } as FilterDefinitionWithValues;
    const wrapper = shallow(
      <SearchFilterGroup
        activeFilterValues={activeFilterValues}
        addFilter={addFilter}
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

  it('deduplicates keys between the filter and the active filter values', () => {
    const activeFilterValues = [
      { primaryKey: 'value-2', humanName: 'Value Two' },
      { primaryKey: 'value-3', humanName: 'Value Three' },
    ];
    const filter = {
      humanName: 'Example filter',
      values: [
        { primaryKey: 'value-1', humanName: 'Value One' },
        { primaryKey: 'value-3', humanName: 'Value Three' },
      ],
    } as FilterDefinitionWithValues;
    const wrapper = shallow(
      <SearchFilterGroup
        activeFilterValues={activeFilterValues}
        addFilter={addFilter}
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
    ).toContain('Value Three');
    expect(
      wrapper
        .find(SearchFilter)
        .at(2)
        .shallow()
        .text(),
    ).toContain('Value One');
  });
});
