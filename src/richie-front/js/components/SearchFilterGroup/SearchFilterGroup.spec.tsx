import '../../testSetup';

import { mount, ReactWrapper } from 'enzyme';
import * as React from 'react';
import { IntlProvider } from 'react-intl';

import { FilterDefinitionWithValues } from '../../types/filters';
import { SearchFilter } from '../SearchFilter/SearchFilter';
import { SearchFilterGroup } from './SearchFilterGroup';

describe('components/SearchFilterGroup', () => {
  const addFilter = jasmine.createSpy('addFilter');
  const removeFilter = jasmine.createSpy('removeFilter');
  let makeSearchFilterGroup: (element: JSX.Element) => ReactWrapper;

  beforeEach(() => {
    // Mount our whole filters group whenever we need it.
    makeSearchFilterGroup = element =>
      mount(<IntlProvider>{element}</IntlProvider>);
  });

  it('renders the name of the filter', () => {
    const filter = {
      humanName: { defaultMessage: 'Organizations', id: 'organizations' },
      machineName: 'organizations',
      values: [],
    } as FilterDefinitionWithValues;
    const element = (
      <SearchFilterGroup
        activeFilterValues={[]}
        addFilter={addFilter}
        filter={filter}
        removeFilter={removeFilter}
      />
    );

    expect(makeSearchFilterGroup(element).text()).toContain('Organizations');
  });

  it('renders the list of filter values into a list of SearchFilters', () => {
    const filter = {
      humanName: { defaultMessage: 'Example filter', id: 'exampleFilter' },
      values: [
        {
          humanName: { defaultMessage: 'Value One', id: 'valueOne' },
          primaryKey: 'value-1',
        },
        {
          humanName: { defaultMessage: 'Value Two', id: 'valueTwo' },
          primaryKey: 'value-2',
        },
      ],
    } as FilterDefinitionWithValues;
    const element = (
      <SearchFilterGroup
        activeFilterValues={[]}
        addFilter={addFilter}
        filter={filter}
        removeFilter={removeFilter}
      />
    );

    expect(makeSearchFilterGroup(element).find(SearchFilter).length).toEqual(2);
  });

  it('renders any active filter values at the top of the list', () => {
    const activeFilterValues = [
      {
        humanName: { defaultMessage: 'Value Two', id: 'valueTwo' },
        primaryKey: 'value-2',
      },
    ];
    const filter = {
      humanName: { defaultMessage: 'Example filter', id: 'exampleFilter' },
      values: [
        {
          humanName: { defaultMessage: 'Value One', id: 'valueOne' },
          primaryKey: 'value-1',
        },
        {
          humanName: { defaultMessage: 'Value Three', id: 'valueThree' },
          primaryKey: 'value-3',
        },
      ],
    } as FilterDefinitionWithValues;
    const element = (
      <SearchFilterGroup
        activeFilterValues={activeFilterValues}
        addFilter={addFilter}
        filter={filter}
        removeFilter={removeFilter}
      />
    );

    expect(
      makeSearchFilterGroup(element)
        .find(SearchFilter)
        .at(0)
        .render()
        .text(),
    ).toContain('Value Two');
    expect(
      makeSearchFilterGroup(element)
        .find(SearchFilter)
        .at(1)
        .render()
        .text(),
    ).toContain('Value One');
    expect(
      makeSearchFilterGroup(element)
        .find(SearchFilter)
        .at(2)
        .render()
        .text(),
    ).toContain('Value Three');
  });

  it('deduplicates keys between the filter and the active filter values', () => {
    const activeFilterValues = [
      {
        humanName: { defaultMessage: 'Value Two', id: 'valueTwo' },
        primaryKey: 'value-2',
      },
      {
        humanName: { defaultMessage: 'Value Three', id: 'valueThree' },
        primaryKey: 'value-3',
      },
    ];
    const filter = {
      humanName: { defaultMessage: 'Example filter', id: 'exampleFilter' },
      values: [
        {
          humanName: { defaultMessage: 'Value One', id: 'valueOne' },
          primaryKey: 'value-1',
        },
        {
          humanName: { defaultMessage: 'Value Three', id: 'valueThree' },
          primaryKey: 'value-3',
        },
      ],
    } as FilterDefinitionWithValues;
    const element = (
      <IntlProvider>
        <SearchFilterGroup
          activeFilterValues={activeFilterValues}
          addFilter={addFilter}
          filter={filter}
          removeFilter={removeFilter}
        />
      </IntlProvider>
    );

    expect(
      makeSearchFilterGroup(element)
        .find(SearchFilter)
        .at(0)
        .render()
        .text(),
    ).toContain('Value Two');
    expect(
      makeSearchFilterGroup(element)
        .find(SearchFilter)
        .at(1)
        .render()
        .text(),
    ).toContain('Value Three');
    expect(
      makeSearchFilterGroup(element)
        .find(SearchFilter)
        .at(2)
        .render()
        .text(),
    ).toContain('Value One');
  });
});
