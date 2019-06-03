import '../../testSetup';

import { cleanup, fireEvent, render, wait } from '@testing-library/react';
import React from 'react';
import { IntlProvider } from 'react-intl';

jest.mock('../../data/getResourceList/getResourceList', () => ({
  fetchList: jest.fn(),
}));

import { fetchList } from '../../data/getResourceList/getResourceList';
import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';
import { jestMockOf } from '../../utils/types';
import { SearchFilterValueParent } from './SearchFilterValueParent';

const mockFetchList: jestMockOf<typeof fetchList> = fetchList as any;

describe('<SearchFilterValueParent />', () => {
  // Disable useless async act warnings
  // TODO: remove this spy as soon as async act is available
  beforeAll(() => {
    jest.spyOn(console, 'error');
  });

  afterEach(() => {
    cleanup();
    jest.resetAllMocks();
  });

  it('renders the parent filter value and a button to show the children', () => {
    const { getByLabelText, queryByLabelText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[{ limit: '999', offset: '0' }, jest.fn()]}
        >
          <SearchFilterValueParent
            filter={{
              base_path: '00010002',
              human_name: 'Subjects',
              is_autocompletable: true,
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

    getByLabelText((content, _) => content.includes('Literature'));
    expect(getByLabelText('Show child filters')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(
      queryByLabelText((content, _) =>
        content.includes('Classical Literature'),
      ),
    ).toEqual(null);
    expect(
      queryByLabelText((content, _) => content.includes('Modern Literature')),
    ).toEqual(null);
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

    const { getByLabelText } = render(
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
              human_name: 'Subjects',
              is_autocompletable: true,
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

    getByLabelText((content, _) => content.includes('Literature'));
    const button = getByLabelText('Hide child filters');
    expect(button).toHaveAttribute('aria-pressed', 'true');

    await wait();
    getByLabelText((content, _) => content.includes('Classical Literature'));
    getByLabelText((content, _) => content.includes('Modern Literature'));
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
              human_name: 'Subjects',
              is_autocompletable: true,
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

    getByLabelText((content, _) => content.includes('Literature'));
    getByLabelText('Hide child filters');
    expect(getByLabelText('Hide child filters')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await wait();
    getByLabelText((content, _) => content.includes('Classical Literature'));
    getByLabelText((content, _) => content.includes('Modern Literature'));

    expect(mockFetchList).toHaveBeenCalledTimes(1);
    expect(mockFetchList).toHaveBeenLastCalledWith('courses', {
      limit: '999',
      offset: '0',
      scope: 'filters',
      subjects: ['L-000400050004'],
      subjects_include: '.-00040005.{4,}',
    });

    fireEvent.click(getByLabelText('Hide child filters'));

    getByLabelText((content, _) => content.includes('Literature'));
    expect(getByLabelText('Show child filters')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(
      queryByLabelText((content, _) =>
        content.includes('Classical Literature'),
      ),
    ).toEqual(null);
    expect(
      queryByLabelText((content, _) => content.includes('Modern Literature')),
    ).toEqual(null);
    expect(mockFetchList).toHaveBeenCalledTimes(1);

    fireEvent.click(getByLabelText('Show child filters'));

    getByLabelText('Hide child filters');
    expect(mockFetchList).toHaveBeenCalledTimes(2);
    expect(mockFetchList).toHaveBeenLastCalledWith('courses', {
      limit: '999',
      offset: '0',
      scope: 'filters',
      subjects: ['L-000400050004'],
      subjects_include: '.-00040005.{4,}',
    });
    expect(getByLabelText('Hide child filters')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await wait();
    getByLabelText((content, _) => content.includes('Classical Literature'));
    getByLabelText((content, _) => content.includes('Modern Literature'));
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
              human_name: 'Filter name',
              is_autocompletable: true,
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
    const checkbox = getByLabelText((content, _) =>
      content.includes('Human name'),
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
              human_name: 'Filter name',
              is_autocompletable: true,
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
    const checkbox = getByLabelText((content, _) =>
      content.includes('Human name'),
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
              human_name: 'Filter name',
              is_autocompletable: true,
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

    const checkbox = getByLabelText((content, _) =>
      content.includes('Human name'),
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
              human_name: 'Filter name',
              is_autocompletable: true,
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
      getByLabelText((content, _) => content.includes('Human name')),
    );
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      filter: {
        base_path: '0009',
        human_name: 'Filter name',
        is_autocompletable: true,
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
              human_name: 'Filter name',
              is_autocompletable: true,
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
      getByLabelText((content, _) => content.includes('Human name')),
    );
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      filter: {
        base_path: '0009',
        human_name: 'Filter name',
        is_autocompletable: true,
        name: 'filter_name',
        values: [],
      },
      payload: 'P-00040005',
      type: 'FILTER_REMOVE',
    });
  });
});
