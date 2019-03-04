import '../../testSetup';

import React from 'react';
import { cleanup, fireEvent, render } from 'react-testing-library';

import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';
import { SearchFilterValueParent } from './SearchFilterValueParent';

describe('<SearchFilterValueParent />', () => {
  afterEach(cleanup);

  it('renders the parent filter value and a button to show the children', () => {
    const { getByText, getByLabelText, queryByText } = render(
      <CourseSearchParamsContext.Provider
        value={[{ limit: '999', offset: '0' }, jest.fn()]}
      >
        <SearchFilterValueParent
          filter={{
            human_name: 'Subjects',
            name: 'subjects',
            values: [],
          }}
          value={{
            children: [
              { count: 3, human_name: 'Classical Literature', key: '46' },
              { count: 9, human_name: 'Modern Literature', key: '47' },
            ],
            count: 12,
            human_name: 'Literature',
            key: '45',
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );

    getByText('Literature');
    expect(getByLabelText('Show child filters')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(queryByText('Classical Literature')).toEqual(null);
    expect(queryByText('Modern Literature')).toEqual(null);
  });

  it('renders the children on load when one of them is active', () => {
    const { getByText, getByLabelText } = render(
      <CourseSearchParamsContext.Provider
        value={[{ limit: '999', offset: '0', subjects: ['47'] }, jest.fn()]}
      >
        <SearchFilterValueParent
          filter={{
            human_name: 'Subjects',
            name: 'subjects',
            values: [],
          }}
          value={{
            children: [
              { count: 3, human_name: 'Classical Literature', key: '46' },
              { count: 9, human_name: 'Modern Literature', key: '47' },
            ],
            count: 12,
            human_name: 'Literature',
            key: '45',
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );

    getByText('Literature');
    expect(getByLabelText('Hide child filters')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    getByText('Classical Literature');
    getByText('Modern Literature');
  });

  it('hides/show the children when the user clicks on the toggle button', () => {
    const { getByText, getByLabelText, queryByText } = render(
      <CourseSearchParamsContext.Provider
        value={[{ limit: '999', offset: '0', subjects: ['47'] }, jest.fn()]}
      >
        <SearchFilterValueParent
          filter={{
            human_name: 'Subjects',
            name: 'subjects',
            values: [],
          }}
          value={{
            children: [
              { count: 3, human_name: 'Classical Literature', key: '46' },
              { count: 9, human_name: 'Modern Literature', key: '47' },
            ],
            count: 12,
            human_name: 'Literature',
            key: '45',
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );

    getByText('Literature');
    expect(getByLabelText('Hide child filters')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    getByText('Classical Literature');
    getByText('Modern Literature');

    fireEvent.click(getByLabelText('Hide child filters'));

    getByText('Literature');
    expect(getByLabelText('Show child filters')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(queryByText('Classical Literature')).toEqual(null);
    expect(queryByText('Modern Literature')).toEqual(null);

    fireEvent.click(getByLabelText('Show child filters'));

    getByText('Literature');
    expect(getByLabelText('Hide child filters')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    getByText('Classical Literature');
    getByText('Modern Literature');
  });

  it('shows the parent filter value itself as inactive when it is not in the search params', () => {
    const { getByText } = render(
      <CourseSearchParamsContext.Provider
        value={[{ limit: '999', offset: '0' }, jest.fn()]}
      >
        <SearchFilterValueParent
          filter={{
            human_name: 'Filter name',
            name: 'filter_name',
            values: [],
          }}
          value={{
            children: [],
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

  it('shows the parent filter value itself as active when it is in the search params', () => {
    const { getByText } = render(
      <CourseSearchParamsContext.Provider
        value={[{ filter_name: '42', limit: '999', offset: '0' }, jest.fn()]}
      >
        <SearchFilterValueParent
          filter={{
            human_name: 'Filter name',
            name: 'filter_name',
            values: [],
          }}
          value={{
            children: [],
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
        <SearchFilterValueParent
          filter={{
            human_name: 'Filter name',
            name: 'filter_name',
            values: [],
          }}
          value={{
            children: [],
            count: 217,
            human_name: 'Human name',
            key: '43',
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );

    fireEvent.click(getByText('Human name'));
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      filter: { human_name: 'Filter name', name: 'filter_name', values: [] },
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
        <SearchFilterValueParent
          filter={{
            human_name: 'Filter name',
            name: 'filter_name',
            values: [],
          }}
          value={{
            children: [],
            count: 217,
            human_name: 'Human name',
            key: '44',
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );

    fireEvent.click(getByText('Human name'));
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      filter: { human_name: 'Filter name', name: 'filter_name', values: [] },
      payload: '44',
      type: 'FILTER_REMOVE',
    });
  });
});
