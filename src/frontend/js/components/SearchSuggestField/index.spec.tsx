import { act, fireEvent, render, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';

import {
  useCourseSearchParams,
  CourseSearchParamsAction,
} from 'data/useCourseSearchParams';
import { HistoryProvider } from 'data/useHistory';
import { CommonDataProps } from 'types/commonDataProps';
import { FilterDefinition } from 'types/filters';
import { history, location } from 'utils/indirection/window';
import { SearchSuggestField } from '.';

// Unexplained difficulties with fake timers were encountered in these tests.
// We decided to mock the debounce function instead.
jest.mock('lodash-es/debounce', () => (fn: any) => (...args: any[]) =>
  fn(...args),
);

jest.mock('settings', () => ({
  API_LIST_DEFAULT_PARAMS: { limit: '13', offset: '0' },
}));

jest.mock('utils/indirection/window', () => ({
  history: {
    pushState: jest.fn(),
    replaceState: jest.fn(),
  },
  location: { pathname: '/search' },
  scroll: jest.fn(),
}));

describe('components/SearchSuggestField', () => {
  const context: CommonDataProps['context'] = {
    csrftoken: 'the csrf token',
    environment: 'frontend_tests',
    release: '9.8.7',
    sentry_dsn: null,
  };

  // Make some filters we can reuse through our tests with the filter definitions responses
  const levels: FilterDefinition = {
    base_path: '00030002',
    human_name: 'Levels',
    is_autocompletable: false,
    is_searchable: false,
    name: 'levels',
    position: 0,
  };

  const organizations: FilterDefinition = {
    base_path: '0002',
    human_name: 'Organizations',
    is_autocompletable: true,
    is_searchable: true,
    name: 'organizations',
    position: 1,
  };

  const persons: FilterDefinition = {
    base_path: null,
    human_name: 'Persons',
    is_autocompletable: true,
    is_searchable: true,
    name: 'persons',
    position: 2,
  };

  const subjects: FilterDefinition = {
    base_path: '00030001',
    human_name: 'Subjects',
    is_autocompletable: true,
    is_searchable: true,
    name: 'subjects',
    position: 3,
  };

  afterEach(() => fetchMock.restore());
  beforeEach(jest.resetAllMocks);
  beforeEach(() => (location.search = ''));

  it('renders', () => {
    const { getByPlaceholderText } = render(
      <IntlProvider locale="en">
        <HistoryProvider>
          <SearchSuggestField context={context} />
        </HistoryProvider>
      </IntlProvider>,
    );

    // The placeholder text is shown in the input
    getByPlaceholderText('Search for courses, organizations, categories');
  });

  it('picks the query from the URL if there is one', () => {
    location.search = '?limit=20&offset=0&query=machine%20learning';
    const { getByDisplayValue } = render(
      <IntlProvider locale="en">
        <HistoryProvider>
          <SearchSuggestField context={context} />
        </HistoryProvider>
      </IntlProvider>,
    );

    // The existing query is shown in the input
    getByDisplayValue('machine learning');
  });

  it('clears the input field when the query is removed by another component elsewhere in the tree', () => {
    let doDispatchCourseSearchParamsUpdate: any;
    const OtherComponent = () => {
      const { dispatchCourseSearchParamsUpdate } = useCourseSearchParams();
      doDispatchCourseSearchParamsUpdate = dispatchCourseSearchParamsUpdate;
      return <div></div>;
    };

    location.search = '?limit=20&offset=0&query=social%20sciences';
    const { getByDisplayValue, rerender } = render(
      <IntlProvider locale="en">
        <HistoryProvider>
          <SearchSuggestField context={context} />
          <OtherComponent />
        </HistoryProvider>
      </IntlProvider>,
    );

    // The existing query is shown in the input
    const input: any = getByDisplayValue('social sciences');

    // Some other component resets the filter, in effect clearing the query
    act(() =>
      doDispatchCourseSearchParamsUpdate({
        type: CourseSearchParamsAction.filterReset,
      }),
    );
    rerender(
      <IntlProvider locale="en">
        <HistoryProvider>
          <SearchSuggestField context={context} />
          <OtherComponent />
        </HistoryProvider>
      </IntlProvider>,
    );

    // The input does not show a value anymore
    expect(input.value).toEqual('');

    // Simulate the user entering some text in the autocomplete field
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'au' } });

    expect(input.value).toEqual('au');
  });

  it('gets suggestions from the API when the user types something in the field', async () => {
    fetchMock.get('/api/v1.0/filter-definitions/', {
      levels,
      organizations,
      persons,
      subjects,
    });

    fetchMock.get('/api/v1.0/subjects/autocomplete/?query=aut', [
      {
        id: 'L-000300010001',
        title: 'Subject #311',
      },
    ]);
    ['organizations', 'persons'].forEach((kind) =>
      fetchMock.get(`/api/v1.0/${kind}/autocomplete/?query=aut`, []),
    );

    const { getByPlaceholderText, getByText, queryByText } = render(
      <IntlProvider locale="en">
        <HistoryProvider>
          <SearchSuggestField context={context} />
        </HistoryProvider>
      </IntlProvider>,
    );

    const field = getByPlaceholderText(
      'Search for courses, organizations, categories',
    );

    // Simulate the user entering some text in the autocomplete field
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'aut' } });

    await waitFor(() => {
      expect(
        fetchMock.called('/api/v1.0/subjects/autocomplete/?query=aut'),
      ).toEqual(true);
    });
    getByText('Subjects');
    getByText('Subject #311');

    expect(
      fetchMock.called('/api/v1.0/levels/autocomplete/?query=aut'),
    ).toEqual(false);
    expect(queryByText('Levels')).toEqual(null);

    expect(
      fetchMock.called('/api/v1.0/organizations/autocomplete/?query=aut'),
    ).toEqual(true);
    expect(queryByText('Organizations')).toEqual(null);

    expect(
      fetchMock.called('/api/v1.0/persons/autocomplete/?query=aut'),
    ).toEqual(true);
    expect(queryByText('Persons')).toEqual(null);
  });

  it('does not attempt to get or show any suggestions before the user types 3 characters', async () => {
    fetchMock.get('/api/v1.0/filter-definitions/', {
      levels,
      organizations,
      persons,
      subjects,
    });

    ['organizations', 'persons', 'subjects'].forEach((kind) =>
      fetchMock.get(`/api/v1.0/${kind}/autocomplete/?query=xyz`, []),
    );

    const { getByPlaceholderText } = render(
      <IntlProvider locale="en">
        <HistoryProvider>
          <SearchSuggestField context={context} />
        </HistoryProvider>
      </IntlProvider>,
    );

    const field = getByPlaceholderText(
      'Search for courses, organizations, categories',
    );

    // Simulate the user entering some text in the autocomplete field
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'x' } });
    await waitFor(() => {
      expect(fetchMock.calls().length).toEqual(0);
    });

    fireEvent.change(field, { target: { value: 'xyz' } });
    await waitFor(() => {
      expect(
        fetchMock.called('/api/v1.0/subjects/autocomplete/?query=xyz'),
      ).toEqual(true);
    });
    expect(
      fetchMock.called('/api/v1.0/levels/autocomplete/?query=xyz'),
    ).toEqual(false);
    expect(
      fetchMock.called('/api/v1.0/organizations/autocomplete/?query=xyz'),
    ).toEqual(true);
    expect(
      fetchMock.called('/api/v1.0/persons/autocomplete/?query=xyz'),
    ).toEqual(true);
  });

  it('updates the search params when the user selects a filter suggestion', async () => {
    fetchMock.get('/api/v1.0/filter-definitions/', {
      levels,
      organizations,
      persons,
      subjects,
    });

    fetchMock.get('/api/v1.0/organizations/autocomplete/?query=orga', [
      {
        id: 'L-00020007',
        kind: 'whatever',
        title: 'Organization #27',
      },
    ]);
    ['persons', 'subjects'].forEach((kind) =>
      fetchMock.get(`/api/v1.0/${kind}/autocomplete/?query=orga`, []),
    );

    const { getByPlaceholderText, getByText, queryByText } = render(
      <IntlProvider locale="en">
        <HistoryProvider>
          <SearchSuggestField context={context} />
        </HistoryProvider>
      </IntlProvider>,
    );

    const field = getByPlaceholderText(
      'Search for courses, organizations, categories',
    );

    // Simulate the user entering some text in the autocomplete field
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'orga' } });

    await waitFor(() => {
      expect(history.pushState).toHaveBeenCalledTimes(1);
    });
    expect(history.pushState).toHaveBeenLastCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: { limit: '13', offset: '0', query: 'orga' },
        },
      },
      '',
      '/search?limit=13&offset=0&query=orga',
    );

    expect(
      fetchMock.called('/api/v1.0/levels/autocomplete/?query=orga'),
    ).toEqual(false);
    expect(queryByText('Levels')).toEqual(null);

    expect(
      fetchMock.called('/api/v1.0/organizations/autocomplete/?query=orga'),
    ).toEqual(true);
    getByText('Organizations');
    getByText('Organization #27');

    expect(
      fetchMock.called('/api/v1.0/persons/autocomplete/?query=orga'),
    ).toEqual(true);
    expect(queryByText('Persons')).toEqual(null);

    expect(
      fetchMock.called('/api/v1.0/subjects/autocomplete/?query=orga'),
    ).toEqual(true);
    expect(queryByText('Subjects')).toEqual(null);

    fireEvent.click(getByText('Organization #27'));

    await waitFor(() => {
      expect(history.pushState).toHaveBeenCalledTimes(2);
    });
    expect(history.pushState).toHaveBeenCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: {
            limit: '13',
            offset: '0',
            organizations: ['L-00020007'],
            query: undefined,
          },
        },
      },
      '',
      '/search?limit=13&offset=0&organizations=L-00020007',
    );
  });

  it('updates the search params when the user selects a filter suggestion', async () => {
    fetchMock.get('/api/v1.0/filter-definitions/', {
      levels,
      organizations,
      persons,
      subjects,
    });

    fetchMock.get('/api/v1.0/persons/autocomplete/?query=doct', [
      {
        id: '73',
        kind: 'persons',
        title: 'Doctor Doom',
      },
    ]);
    ['organizations', 'subjects'].forEach((kind) =>
      fetchMock.get(`/api/v1.0/${kind}/autocomplete/?query=doct`, []),
    );

    const { getByPlaceholderText, getByText, queryByText } = render(
      <IntlProvider locale="en">
        <HistoryProvider>
          <SearchSuggestField context={context} />
        </HistoryProvider>
      </IntlProvider>,
    );

    const field = getByPlaceholderText(
      'Search for courses, organizations, categories',
    );

    // Simulate the user entering some text in the autocomplete field
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'doct' } });

    await waitFor(() => {
      expect(history.pushState).toHaveBeenCalledTimes(1);
    });
    expect(history.pushState).toHaveBeenCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: { limit: '13', offset: '0', query: 'doct' },
        },
      },
      '',
      '/search?limit=13&offset=0&query=doct',
    );

    expect(
      fetchMock.called('/api/v1.0/levels/autocomplete/?query=doct'),
    ).toEqual(false);
    expect(queryByText('Levels')).toEqual(null);

    expect(
      fetchMock.called('/api/v1.0/organizations/autocomplete/?query=doct'),
    ).toEqual(true);
    expect(queryByText('Organizations')).toEqual(null);

    expect(
      fetchMock.called('/api/v1.0/persons/autocomplete/?query=doct'),
    ).toEqual(true);
    getByText('Persons');
    getByText('Doctor Doom');

    expect(
      fetchMock.called('/api/v1.0/subjects/autocomplete/?query=doct'),
    ).toEqual(true);
    expect(queryByText('Subjects')).toEqual(null);

    fireEvent.click(getByText('Doctor Doom'));

    await waitFor(() => {
      expect(history.pushState).toHaveBeenCalledTimes(2);
    });
    expect(history.pushState).toHaveBeenCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: {
            limit: '13',
            offset: '0',
            persons: ['73'],
            query: undefined,
          },
        },
      },
      '',
      '/search?limit=13&offset=0&persons=73',
    );
  });

  it('removes the search query when the user presses ENTER on an empty field', async () => {
    location.search = '?limit=20&offset=0&query=some%20query';

    fetchMock.get('/api/v1.0/filter-definitions/', {
      levels,
      organizations,
      persons,
      subjects,
    });

    ['organizations', 'persons', 'subjects'].forEach((kind) =>
      fetchMock.get(`/api/v1.0/${kind}/autocomplete/?query=some%20query`, []),
    );

    const { getByPlaceholderText } = render(
      <IntlProvider locale="en">
        <HistoryProvider>
          <SearchSuggestField context={context} />
        </HistoryProvider>
      </IntlProvider>,
    );

    const field = getByPlaceholderText(
      'Search for courses, organizations, categories',
    );

    // Simulate the user deleting the text in the autocomplete field
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: '' } });
    fireEvent.keyDown(field, { keyCode: 13 });

    await waitFor(() => {
      expect(history.pushState).toHaveBeenCalledWith(
        {
          name: 'courseSearch',
          data: {
            lastDispatchActions: expect.any(Array),
            params: { limit: '20', offset: '0', query: undefined },
          },
        },
        '',
        '/search?limit=20&offset=0',
      );
    });
  });

  it('searches as the user types', async () => {
    fetchMock.get('/api/v1.0/filter-definitions/', {
      levels,
      organizations,
      persons,
      subjects,
    });

    ['organizations', 'persons', 'subjects'].forEach((kind) =>
      fetchMock.get(`begin:/api/v1.0/${kind}/autocomplete/?query=`, []),
    );

    const { getByPlaceholderText } = render(
      <IntlProvider locale="en">
        <HistoryProvider>
          <SearchSuggestField context={context} />
        </HistoryProvider>
      </IntlProvider>,
    );

    const field = getByPlaceholderText(
      'Search for courses, organizations, categories',
    );
    fireEvent.focus(field);

    // NB: the tests below rely on the very crude debounce mock for lodash-debounce.
    // TODO: rewrite them when we use mocked timers to test our debouncing strategy.
    fireEvent.change(field, { target: { value: 'ri' } });
    await waitFor(() => {
      expect(history.pushState).not.toHaveBeenCalled();
    });

    fireEvent.change(field, { target: { value: 'ric' } });
    await waitFor(() => {
      expect(history.pushState).toHaveBeenCalledTimes(1);
    });
    expect(history.pushState).toHaveBeenLastCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: { limit: '13', offset: '0', query: 'ric' },
        },
      },
      '',
      '/search?limit=13&offset=0&query=ric',
    );

    fireEvent.change(field, { target: { value: 'rich data driven' } });
    await waitFor(() => {
      expect(history.pushState).toHaveBeenCalledTimes(2);
    });
    expect(history.pushState).toHaveBeenLastCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: { limit: '13', offset: '0', query: 'rich data driven' },
        },
      },
      '',
      '/search?limit=13&offset=0&query=rich%20data%20driven',
    );

    fireEvent.change(field, { target: { value: '' } });
    await waitFor(() => {
      expect(history.pushState).toHaveBeenCalledTimes(3);
    });
    expect(history.pushState).toHaveBeenLastCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: { limit: '13', offset: '0', query: undefined },
        },
      },
      '',
      '/search?limit=13&offset=0',
    );
  });

  it('does not search until the user types 3 actual (non-space) characters', async () => {
    fetchMock.get('/api/v1.0/filter-definitions/', {
      levels,
      organizations,
      persons,
      subjects,
    });

    ['organizations', 'persons', 'subjects'].forEach((kind) =>
      fetchMock.get(`begin:/api/v1.0/${kind}/autocomplete/?query=`, []),
    );

    const { getByPlaceholderText } = render(
      <IntlProvider locale="en">
        <HistoryProvider>
          <SearchSuggestField context={context} />
        </HistoryProvider>
      </IntlProvider>,
    );

    const field = getByPlaceholderText(
      'Search for courses, organizations, categories',
    );
    fireEvent.focus(field);

    // NB: the tests below rely on the very crude debounce mock for lodash-debounce.
    // TODO: rewrite them when we use mocked timers to test our debouncing strategy.
    fireEvent.change(field, { target: { value: 'ri' } });
    await waitFor(() => {
      expect(history.pushState).not.toHaveBeenCalled();
    });

    fireEvent.change(field, { target: { value: 'ri ' } });
    await waitFor(() => {
      expect(history.pushState).not.toHaveBeenCalled();
    });

    fireEvent.change(field, { target: { value: ' ri' } });
    await waitFor(() => {
      expect(history.pushState).not.toHaveBeenCalled();
    });

    fireEvent.change(field, { target: { value: 'ric' } });
    await waitFor(() => {
      expect(history.pushState).toHaveBeenCalledTimes(1);
    });
    expect(history.pushState).toHaveBeenLastCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: { limit: '13', offset: '0', query: 'ric' },
        },
      },
      '',
      '/search?limit=13&offset=0&query=ric',
    );
  });

  it('does not remove other filters when it searches as the user types', async () => {
    fetchMock.get('/api/v1.0/filter-definitions/', {
      levels,
      organizations,
      persons,
      subjects,
    });

    fetchMock.get('/api/v1.0/organizations/autocomplete/?query=orga', [
      {
        id: 'L-00020007',
        kind: 'whatever',
        title: 'Organization #27',
      },
    ]);
    fetchMock.get('/api/v1.0/organizations/autocomplete/?query=ric', []);

    ['persons', 'subjects'].forEach((kind) =>
      fetchMock.get(`begin:/api/v1.0/${kind}/autocomplete/?query=`, []),
    );

    const { getByPlaceholderText, getByText } = render(
      <IntlProvider locale="en">
        <HistoryProvider>
          <SearchSuggestField context={context} />
        </HistoryProvider>
      </IntlProvider>,
    );

    const field = getByPlaceholderText(
      'Search for courses, organizations, categories',
    );
    fireEvent.focus(field);

    // The user is typing an organization name
    fireEvent.change(field, { target: { value: 'orga' } });
    await waitFor(() => {
      expect(history.pushState).toHaveBeenCalledTimes(1);
    });
    expect(history.pushState).toHaveBeenLastCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: { limit: '13', offset: '0', query: 'orga' },
        },
      },
      '',
      '/search?limit=13&offset=0&query=orga',
    );
    // The user selects an organization from suggestions
    fireEvent.click(getByText('Organization #27'));
    await waitFor(() => {
      expect(history.pushState).toHaveBeenCalledTimes(2);
    });
    expect(history.pushState).toHaveBeenCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: {
            limit: '13',
            offset: '0',
            organizations: ['L-00020007'],
            query: undefined,
          },
        },
      },
      '',
      '/search?limit=13&offset=0&organizations=L-00020007',
    );

    // The user starts typing a full-text search, the organization remains selected
    fireEvent.change(field, { target: { value: 'ric' } });
    await waitFor(() => {
      expect(history.pushState).toHaveBeenCalledTimes(3);
    });
    expect(history.pushState).toHaveBeenLastCalledWith(
      {
        name: 'courseSearch',
        data: {
          lastDispatchActions: expect.any(Array),
          params: {
            limit: '13',
            offset: '0',
            organizations: ['L-00020007'],
            query: 'ric',
          },
        },
      },
      '',
      '/search?limit=13&offset=0&organizations=L-00020007&query=ric',
    );
  });
});
