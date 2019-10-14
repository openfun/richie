import 'testSetup';

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { CourseSearchParamsContext } from 'data/useCourseSearchParams';
import { SearchFilterValueLeaf } from '.';

describe('components/SearchFilterValueLeaf', () => {
  it('renders the name of the filter value', () => {
    const { getByLabelText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[{ limit: '999', offset: '0' }, jest.fn()]}
        >
          <SearchFilterValueLeaf
            filter={{
              base_path: null,
              has_more_values: false,
              human_name: 'Filter name',
              is_autocompletable: true,
              is_searchable: true,
              name: 'filter_name',
              values: [],
            }}
            value={{
              count: 217,
              human_name: 'Human name',
              key: '42',
            }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    // The filter value is displayed with its facet count
    const checkbox = getByLabelText((content, _) =>
      content.includes('Human name'),
    );
    expect(checkbox.parentElement).toHaveTextContent('(217)');
    // The filter is not currently active
    expect(checkbox).not.toHaveAttribute('checked');
    expect(checkbox.parentElement).not.toHaveClass('active');
  });

  it('shows the filter value as active when it is in the search params', () => {
    const { getByLabelText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[{ filter_name: '42', limit: '999', offset: '0' }, jest.fn()]}
        >
          <SearchFilterValueLeaf
            filter={{
              base_path: null,
              has_more_values: false,
              human_name: 'Filter name',
              is_autocompletable: true,
              is_searchable: true,
              name: 'filter_name',
              values: [],
            }}
            value={{
              count: 217,
              human_name: 'Human name',
              key: '42',
            }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    // The filter shows its active state
    const checkbox = getByLabelText((content, _) =>
      content.includes('Human name'),
    );
    expect(checkbox).toHaveAttribute('checked');
    expect(checkbox.parentElement).toHaveClass('active'); // label that contains checkbox
  });

  it('disables the value when its count is 0', () => {
    const { getByLabelText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[{ limit: '999', offset: '0' }, jest.fn()]}
        >
          <SearchFilterValueLeaf
            filter={{
              base_path: null,
              has_more_values: false,
              human_name: 'Filter name',
              is_autocompletable: true,
              is_searchable: true,
              name: 'filter_name',
              values: [],
            }}
            value={{
              count: 0,
              human_name: 'Human name',
              key: '42',
            }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    // The filter shows its active state
    const checkbox = getByLabelText((content, _) =>
      content.includes('Human name'),
    );
    expect(checkbox).not.toHaveAttribute('checked');
    expect(checkbox).toHaveAttribute('disabled');
    expect(checkbox.parentElement).toHaveClass(
      'search-filter-value-leaf--disabled',
    );
  });

  it('dispatches a FILTER_ADD action on filter click if it was not active', () => {
    const dispatchCourseSearchParamsUpdate = jest.fn();
    const { getByLabelText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            { limit: '999', offset: '0' },
            dispatchCourseSearchParamsUpdate,
          ]}
        >
          <SearchFilterValueLeaf
            filter={{
              base_path: null,
              has_more_values: false,
              human_name: 'Filter name',
              is_autocompletable: true,
              is_searchable: true,
              name: 'filter_name',
              values: [],
            }}
            value={{
              count: 217,
              human_name: 'Human name',
              key: '43',
            }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    fireEvent.click(
      getByLabelText((content, _) => content.includes('Human name')),
    );
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      filter: {
        base_path: null,
        has_more_values: false,
        human_name: 'Filter name',
        is_autocompletable: true,
        is_searchable: true,
        name: 'filter_name',
        values: [],
      },
      payload: '43',
      type: 'FILTER_ADD',
    });
  });

  it('dispatches a FILTER_REMOVE action on filter click if it was active', () => {
    const dispatchCourseSearchParamsUpdate = jest.fn();
    const { getByLabelText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            { filter_name: '44', limit: '999', offset: '0' },
            dispatchCourseSearchParamsUpdate,
          ]}
        >
          <SearchFilterValueLeaf
            filter={{
              base_path: null,
              has_more_values: false,
              human_name: 'Filter name',
              is_autocompletable: true,
              is_searchable: true,
              name: 'filter_name',
              values: [],
            }}
            value={{
              count: 217,
              human_name: 'Human name',
              key: '44',
            }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    fireEvent.click(
      getByLabelText((content, _) => content.includes('Human name')),
    );
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      filter: {
        base_path: null,
        has_more_values: false,
        human_name: 'Filter name',
        is_autocompletable: true,
        is_searchable: true,
        name: 'filter_name',
        values: [],
      },
      payload: '44',
      type: 'FILTER_REMOVE',
    });
  });
});
