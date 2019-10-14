import 'testSetup';

import { fireEvent, render, wait } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

jest.mock('data/getResourceList', () => ({
  fetchList: jest.fn(),
}));

import { fetchList } from 'data/getResourceList';
import { CourseSearchParamsContext } from 'data/useCourseSearchParams';
import { APIListRequestParams } from 'types/api';
import { jestMockOf } from 'utils/types';
import { SearchFilterValueParent } from '.';

const mockFetchList: jestMockOf<typeof fetchList> = fetchList as any;

describe('<SearchFilterValueParent />', () => {
  afterEach(jest.resetAllMocks);

  it('renders the parent filter value and a button to show the children', () => {
    const { getByLabelText, queryByLabelText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[{ limit: '999', offset: '0' }, jest.fn()]}
        >
          <SearchFilterValueParent
            filter={{
              base_path: '00010002',
              has_more_values: false,
              human_name: 'Subjects',
              is_autocompletable: true,
              is_searchable: true,
              name: 'subjects',
              values: [],
            }}
            value={{
              count: 12,
              human_name: 'Literature',
              key: 'P-00040005',
            }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    getByLabelText(content => content.startsWith('Literature'));
    expect(getByLabelText('Show more filters for Literature')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(
      queryByLabelText(content => content.startsWith('Classical Literature')),
    ).toEqual(null);
    expect(
      queryByLabelText(content => content.startsWith('Modern Literature')),
    ).toEqual(null);
  });

  it('shows the children when one of them is active', async () => {
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

    // Helper to get the React element with the expected params
    const getElement = (params: APIListRequestParams) => (
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider value={[params, jest.fn()]}>
          <SearchFilterValueParent
            filter={{
              base_path: '00010002',
              has_more_values: false,
              human_name: 'Subjects',
              is_autocompletable: true,
              is_searchable: true,
              name: 'subjects',
              values: [],
            }}
            value={{
              count: 12,
              human_name: 'Literature',
              key: 'P-00040005',
            }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>
    );
    const { getByLabelText, queryByLabelText, rerender } = render(
      getElement({ limit: '999', offset: '0', subjects: [] }),
    );

    // Children filters are not shown
    getByLabelText(content => content.startsWith('Literature'));
    expect(queryByLabelText('Hide additional filters for Literature')).toEqual(
      null,
    );
    queryByLabelText(content => content.startsWith('Classical Literature'));
    queryByLabelText(content => content.startsWith('Modern Literature'));

    // The params are updated, now include a child filter of Literature
    rerender(
      getElement({ limit: '999', offset: '0', subjects: ['L-000400050004'] }),
    );
    await wait();

    // The children filters are now shown along with an icon to hide them
    getByLabelText(content => content.startsWith('Classical Literature'));
    getByLabelText(content => content.startsWith('Modern Literature'));
    const button = getByLabelText('Hide additional filters for Literature');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('hides/shows the children when the user clicks on the toggle button', async () => {
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

    const { getByLabelText, queryByLabelText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            { limit: '999', offset: '0', subjects: ['L-000400050004'] },
            jest.fn(),
          ]}
        >
          <SearchFilterValueParent
            filter={{
              base_path: '00010002',
              has_more_values: false,
              human_name: 'Subjects',
              is_autocompletable: true,
              is_searchable: true,
              name: 'subjects',
              values: [],
            }}
            value={{
              count: 12,
              human_name: 'Literature',
              key: 'P-00040005',
            }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    getByLabelText(content => content.startsWith('Literature'));
    expect(
      getByLabelText('Hide additional filters for Literature'),
    ).toHaveAttribute('aria-pressed', 'true');
    await wait();
    getByLabelText(content => content.startsWith('Classical Literature'));
    getByLabelText(content => content.startsWith('Modern Literature'));

    expect(mockFetchList).toHaveBeenCalledTimes(1);
    expect(mockFetchList).toHaveBeenLastCalledWith('courses', {
      limit: '999',
      offset: '0',
      scope: 'filters',
      subjects: ['L-000400050004'],
      subjects_include: '.-00040005.{4,}',
    });

    fireEvent.click(getByLabelText('Hide additional filters for Literature'));

    getByLabelText(content => content.startsWith('Literature'));
    expect(getByLabelText('Show more filters for Literature')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(
      queryByLabelText(content => content.startsWith('Classical Literature')),
    ).toEqual(null);
    expect(
      queryByLabelText(content => content.startsWith('Modern Literature')),
    ).toEqual(null);
    expect(mockFetchList).toHaveBeenCalledTimes(1);

    fireEvent.click(getByLabelText('Show more filters for Literature'));

    getByLabelText('Hide additional filters for Literature');
    expect(mockFetchList).toHaveBeenCalledTimes(2);
    expect(mockFetchList).toHaveBeenLastCalledWith('courses', {
      limit: '999',
      offset: '0',
      scope: 'filters',
      subjects: ['L-000400050004'],
      subjects_include: '.-00040005.{4,}',
    });
    expect(
      getByLabelText('Hide additional filters for Literature'),
    ).toHaveAttribute('aria-pressed', 'true');
    await wait();
    getByLabelText(content => content.startsWith('Classical Literature'));
    getByLabelText(content => content.startsWith('Modern Literature'));
  });

  it('shows the parent filter value itself as inactive when it is not in the search params', () => {
    const { getByLabelText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[{ limit: '999', offset: '0' }, jest.fn()]}
        >
          <SearchFilterValueParent
            filter={{
              base_path: '0009',
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
              key: 'P-00040005',
            }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    // The filter value is displayed with its facet count
    const checkbox = getByLabelText(content =>
      content.startsWith('Human name'),
    );
    expect(checkbox!.parentElement).toHaveTextContent('(217)'); // label that contains checkbox
    // The filter is not currently active
    expect(checkbox).not.toHaveAttribute('checked');
    expect(checkbox!.parentElement!.parentElement).not.toHaveClass('active'); // parent self filter
  });

  it('disables the parent value when its count is 0', () => {
    const { getByLabelText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[{ limit: '999', offset: '0' }, jest.fn()]}
        >
          <SearchFilterValueParent
            filter={{
              base_path: '0009',
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
              key: 'P-00040005',
            }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    // The filter shows its active state
    const checkbox = getByLabelText(content =>
      content.startsWith('Human name'),
    );
    expect(checkbox).not.toHaveAttribute('checked');
    expect(checkbox).toHaveAttribute('disabled');
    expect(checkbox.parentElement).toHaveClass(
      'search-filter-value-parent__self__label--disabled',
    );
  });
  it('shows the parent filter value itself as active when it is in the search params', () => {
    const { getByLabelText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            { filter_name: 'P-00040005', limit: '999', offset: '0' },
            jest.fn(),
          ]}
        >
          <SearchFilterValueParent
            filter={{
              base_path: '0009',
              has_more_values: false,
              human_name: 'Filter name',
              is_autocompletable: true,
              is_searchable: true,
              name: 'filter_name',
              values: [],
            }}
            value={{
              count: 218,
              human_name: 'Human name',
              key: 'P-00040005',
            }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    const checkbox = getByLabelText(content =>
      content.startsWith('Human name'),
    );
    expect(checkbox!.parentElement).toHaveTextContent('(218)'); // label that contains checkbox
    expect(checkbox).toHaveAttribute('checked');
    expect(checkbox!.parentElement!.parentElement).toHaveClass('active'); // parent self filter
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
          <SearchFilterValueParent
            filter={{
              base_path: '0009',
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
              key: 'P-00040005',
            }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    fireEvent.click(
      getByLabelText(content => content.startsWith('Human name')),
    );
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      filter: {
        base_path: '0009',
        has_more_values: false,
        human_name: 'Filter name',
        is_autocompletable: true,
        is_searchable: true,
        name: 'filter_name',
        values: [],
      },
      payload: 'P-00040005',
      type: 'FILTER_ADD',
    });
  });

  it('dispatches a FILTER_REMOVE action on filter click if it was active', () => {
    const dispatchCourseSearchParamsUpdate = jest.fn();
    const { getByLabelText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            { filter_name: 'P-00040005', limit: '999', offset: '0' },
            dispatchCourseSearchParamsUpdate,
          ]}
        >
          <SearchFilterValueParent
            filter={{
              base_path: '0009',
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
              key: 'P-00040005',
            }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    fireEvent.click(
      getByLabelText(content => content.startsWith('Human name')),
    );
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      filter: {
        base_path: '0009',
        has_more_values: false,
        human_name: 'Filter name',
        is_autocompletable: true,
        is_searchable: true,
        name: 'filter_name',
        values: [],
      },
      payload: 'P-00040005',
      type: 'FILTER_REMOVE',
    });
  });
});
