import '../../testSetup';

import React from 'react';
import { cleanup, fireEvent, render } from 'react-testing-library';

import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';
import { SearchFilterValueLeaf } from './SearchFilterValueLeaf';

describe('components/SearchFilterValueLeaf', () => {
  afterEach(cleanup);

  it('renders the name of the filter value', () => {
    const { getByText } = render(
      <CourseSearchParamsContext.Provider
        value={[{ limit: '999', offset: '0' }, jest.fn()]}
      >
        <SearchFilterValueLeaf
          filter={{
            base_path: null,
            human_name: 'Filter name',
            name: 'filter_name',
            values: [],
          }}
          value={{
            count: 217,
            human_name: 'Human name',
            key: '42',
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );

    // The filter value is displayed with its facet count
    const button = getByText('Human name').parentElement;
    expect(button).toHaveTextContent('217');
    // The filter is not currently active
    expect(button).not.toHaveClass('active');
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the filter value as active when it is in the search params', () => {
    const { getByText } = render(
      <CourseSearchParamsContext.Provider
        value={[{ filter_name: '42', limit: '999', offset: '0' }, jest.fn()]}
      >
        <SearchFilterValueLeaf
          filter={{
            base_path: null,
            human_name: 'Filter name',
            name: 'filter_name',
            values: [],
          }}
          value={{
            count: 217,
            human_name: 'Human name',
            key: '42',
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );

    // The button shows its active state
    const button = getByText('Human name').parentElement;
    expect(button).toHaveClass('active');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('dispatches a FILTER_ADD action on button click if it was not active', () => {
    const dispatchCourseSearchParamsUpdate = jest.fn();
    const { getByText } = render(
      <CourseSearchParamsContext.Provider
        value={[
          { limit: '999', offset: '0' },
          dispatchCourseSearchParamsUpdate,
        ]}
      >
        <SearchFilterValueLeaf
          filter={{
            base_path: null,
            human_name: 'Filter name',
            name: 'filter_name',
            values: [],
          }}
          value={{
            count: 217,
            human_name: 'Human name',
            key: '43',
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );

    fireEvent.click(getByText('Human name'));
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      filter: {
        base_path: null,
        human_name: 'Filter name',
        name: 'filter_name',
        values: [],
      },
      payload: '43',
      type: 'FILTER_ADD',
    });
  });

  it('dispatches a FILTER_REMOVE action on button click if it was active', () => {
    const dispatchCourseSearchParamsUpdate = jest.fn();
    const { getByText } = render(
      <CourseSearchParamsContext.Provider
        value={[
          { filter_name: '44', limit: '999', offset: '0' },
          dispatchCourseSearchParamsUpdate,
        ]}
      >
        <SearchFilterValueLeaf
          filter={{
            base_path: null,
            human_name: 'Filter name',
            name: 'filter_name',
            values: [],
          }}
          value={{
            count: 217,
            human_name: 'Human name',
            key: '44',
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );

    fireEvent.click(getByText('Human name'));
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      filter: {
        base_path: null,
        human_name: 'Filter name',
        name: 'filter_name',
        values: [],
      },
      payload: '44',
      type: 'FILTER_REMOVE',
    });
  });
});
