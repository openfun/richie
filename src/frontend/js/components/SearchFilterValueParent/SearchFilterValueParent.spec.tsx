import '../../testSetup';

import React from 'react';
import { cleanup, fireEvent, render, wait } from 'react-testing-library';

jest.mock('../../data/getResourceList/getResourceList', () => ({
  fetchList: jest.fn(),
}));

import { fetchList } from '../../data/getResourceList/getResourceList';
import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';
import { jestMockOf } from '../../utils/types';
import { SearchFilterValueParent } from './SearchFilterValueParent';

const mockFetchList: jestMockOf<typeof fetchList> = fetchList as any;

describe('<SearchFilterValueParent />', () => {
  afterEach(() => {
    cleanup();
    jest.resetAllMocks();
  });

  it('renders the parent filter value and a button to show the children', () => {
    const { getByText, getByLabelText, queryByText } = render(
      <CourseSearchParamsContext.Provider
        value={[{ limit: '999', offset: '0' }, jest.fn()]}
      >
        <SearchFilterValueParent
          filter={{
            base_path: '00010002',
            human_name: 'Subjects',
            name: 'subjects',
            values: [],
          }}
          value={{
            count: 12,
            human_name: 'Literature',
            key: 'P-00040005',
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

  it('renders the children on load when one of them is active', async () => {
    mockFetchList.mockResolvedValue({
      content: {
        filters: {
          subjects: {
            values: [
              {
                count: 3,
                human_name: 'Classical Literature',
                key: 'L-000400050003',
              },
              {
                count: 9,
                human_name: 'Modern Literature',
                key: 'L-000400050004',
              },
            ],
          },
        },
      },
    } as any);

    const { getByText, getByLabelText } = render(
      <CourseSearchParamsContext.Provider
        value={[
          { limit: '999', offset: '0', subjects: ['L-000400050004'] },
          jest.fn(),
        ]}
      >
        <SearchFilterValueParent
          filter={{
            base_path: '00010002',
            human_name: 'Subjects',
            name: 'subjects',
            values: [],
          }}
          value={{
            count: 12,
            human_name: 'Literature',
            key: 'P-00040005',
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );

    getByText('Literature');
    const button = getByLabelText('Hide child filters');
    expect(button).toHaveAttribute('aria-pressed', 'true');

    await wait();
    getByText('Classical Literature');
    getByText('Modern Literature');
  });

  it('hides/show the children when the user clicks on the toggle button', async () => {
    mockFetchList.mockResolvedValue({
      content: {
        filters: {
          subjects: {
            values: [
              {
                count: 3,
                human_name: 'Classical Literature',
                key: 'L-000400050003',
              },
              {
                count: 9,
                human_name: 'Modern Literature',
                key: 'L-000400050004',
              },
            ],
          },
        },
      },
    } as any);

    const { getByText, getByLabelText, queryByText } = render(
      <CourseSearchParamsContext.Provider
        value={[
          { limit: '999', offset: '0', subjects: ['L-000400050004'] },
          jest.fn(),
        ]}
      >
        <SearchFilterValueParent
          filter={{
            base_path: '00010002',
            human_name: 'Subjects',
            name: 'subjects',
            values: [],
          }}
          value={{
            count: 12,
            human_name: 'Literature',
            key: 'P-00040005',
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );

    getByText('Literature');
    getByLabelText('Hide child filters');
    expect(getByLabelText('Hide child filters')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await wait();
    getByText('Classical Literature');
    getByText('Modern Literature');

    expect(mockFetchList).toHaveBeenCalledTimes(1);

    fireEvent.click(getByLabelText('Hide child filters'));

    getByText('Literature');
    expect(getByLabelText('Show child filters')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(queryByText('Classical Literature')).toEqual(null);
    expect(queryByText('Modern Literature')).toEqual(null);

    expect(mockFetchList).toHaveBeenCalledTimes(1);

    fireEvent.click(getByLabelText('Show child filters'));

    getByLabelText('Hide child filters');
    expect(mockFetchList).toHaveBeenCalledTimes(2);
    expect(getByLabelText('Hide child filters')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await wait();
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
            base_path: '0009',
            human_name: 'Filter name',
            name: 'filter_name',
            values: [],
          }}
          value={{
            count: 217,
            human_name: 'Human name',
            key: 'P-00040005',
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
        value={[
          { filter_name: 'P-00040005', limit: '999', offset: '0' },
          jest.fn(),
        ]}
      >
        <SearchFilterValueParent
          filter={{
            base_path: '0009',
            human_name: 'Filter name',
            name: 'filter_name',
            values: [],
          }}
          value={{
            count: 217,
            human_name: 'Human name',
            key: 'P-00040005',
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
            base_path: '0009',
            human_name: 'Filter name',
            name: 'filter_name',
            values: [],
          }}
          value={{
            count: 217,
            human_name: 'Human name',
            key: 'P-00040005',
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );

    fireEvent.click(getByText('Human name'));
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      filter: {
        base_path: '0009',
        human_name: 'Filter name',
        name: 'filter_name',
        values: [],
      },
      payload: 'P-00040005',
      type: 'FILTER_ADD',
    });
  });

  it('dispatches a FILTER_REMOVE action on button click if it was active', () => {
    const dispatchCourseSearchParamsUpdate = jest.fn();
    const { getByText } = render(
      <CourseSearchParamsContext.Provider
        value={[
          { filter_name: 'P-00040005', limit: '999', offset: '0' },
          dispatchCourseSearchParamsUpdate,
        ]}
      >
        <SearchFilterValueParent
          filter={{
            base_path: '0009',
            human_name: 'Filter name',
            name: 'filter_name',
            values: [],
          }}
          value={{
            count: 217,
            human_name: 'Human name',
            key: 'P-00040005',
          }}
        />
      </CourseSearchParamsContext.Provider>,
    );

    fireEvent.click(getByText('Human name'));
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      filter: {
        base_path: '0009',
        human_name: 'Filter name',
        name: 'filter_name',
        values: [],
      },
      payload: 'P-00040005',
      type: 'FILTER_REMOVE',
    });
  });
});
