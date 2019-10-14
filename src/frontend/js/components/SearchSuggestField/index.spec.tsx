import 'testSetup';

import { fireEvent, render, wait } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { CourseSearchParamsContext } from 'data/useCourseSearchParams';
import { SearchSuggestField } from '.';

jest.mock('utils/indirection/window', () => ({ location: {} }));

// Unexplained difficulties with fake timers were encountered in these tests.
// We decided to mock the debounce function instead.
jest.mock('lodash-es/debounce', () => (fn: any) => (...args: any[]) =>
  fn(...args),
);

describe('components/SearchSuggestField', () => {
  // Make some filters we can reuse through our tests in <SearchSuggestField /> props
  const levels = {
    base_path: '00030002',
    has_more_values: false,
    human_name: 'Levels',
    is_autocompletable: false,
    is_searchable: false,
    name: 'levels',
    values: [],
  };

  const organizations = {
    base_path: '0002',
    has_more_values: false,
    human_name: 'Organizations',
    is_autocompletable: true,
    is_searchable: true,
    name: 'organizations',
    values: [],
  };

  const persons = {
    base_path: null,
    has_more_values: false,
    human_name: 'Persons',
    is_autocompletable: true,
    is_searchable: true,
    name: 'persons',
    values: [],
  };

  const subjects = {
    base_path: '00030001',
    has_more_values: false,
    human_name: 'Subjects',
    is_autocompletable: true,
    is_searchable: true,
    name: 'subjects',
    values: [],
  };

  afterEach(fetchMock.restore);
  beforeEach(jest.resetAllMocks);

  it('renders', () => {
    const { getByPlaceholderText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[{ limit: '999', offset: '0' }, jest.fn()]}
        >
          <SearchSuggestField filters={{}} />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    // The placeholder text is shown in the input
    getByPlaceholderText('Search for courses, organizations, categories');
  });

  it('picks the query from the URL if there is one', async () => {
    const { getByDisplayValue } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            { limit: '999', offset: '0', query: 'machine learning' },
            jest.fn(),
          ]}
        >
          <SearchSuggestField filters={{}} />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    // The existing query is shown in the input
    getByDisplayValue('machine learning');
  });

  it('gets suggestions from the API when the user types something in the field', async () => {
    fetchMock.get('/api/v1.0/subjects/autocomplete/?query=aut', [
      {
        id: 'L-000300010001',
        title: 'Subject #311',
      },
    ]);
    ['organizations', 'persons'].forEach(kind =>
      fetchMock.get(`/api/v1.0/${kind}/autocomplete/?query=aut`, []),
    );

    const { getByPlaceholderText, getByText, queryByText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[{ limit: '999', offset: '0' }, jest.fn()]}
        >
          <SearchSuggestField
            filters={{ levels, organizations, persons, subjects }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    const field = getByPlaceholderText(
      'Search for courses, organizations, categories',
    );

    // Simulate the user entering some text in the autocomplete field
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'aut' } });
    await wait();

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

    expect(
      fetchMock.called('/api/v1.0/subjects/autocomplete/?query=aut'),
    ).toEqual(true);
    getByText('Subjects');
    getByText('Subject #311');
  });

  it('does not attempt to get or show any suggestions before the user types 3 characters', async () => {
    ['organizations', 'persons', 'subjects'].forEach(kind =>
      fetchMock.get(`/api/v1.0/${kind}/autocomplete/?query=xyz`, []),
    );

    const { getByPlaceholderText, getByText, queryByText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[{ limit: '999', offset: '0' }, jest.fn()]}
        >
          <SearchSuggestField
            filters={{ levels, organizations, persons, subjects }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    const field = getByPlaceholderText(
      'Search for courses, organizations, categories',
    );

    // Simulate the user entering some text in the autocomplete field
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'x' } });
    await wait();
    expect(fetchMock.calls().length).toEqual(0);

    fireEvent.change(field, { target: { value: 'xyz' } });
    await wait();
    expect(
      fetchMock.called('/api/v1.0/levels/autocomplete/?query=xyz'),
    ).toEqual(false);
    expect(
      fetchMock.called('/api/v1.0/organizations/autocomplete/?query=xyz'),
    ).toEqual(true);
    expect(
      fetchMock.called('/api/v1.0/persons/autocomplete/?query=xyz'),
    ).toEqual(true);
    expect(
      fetchMock.called('/api/v1.0/subjects/autocomplete/?query=xyz'),
    ).toEqual(true);
  });

  it('updates the search params when the user selects a filter suggestion', async () => {
    fetchMock.get('/api/v1.0/organizations/autocomplete/?query=orga', [
      {
        id: 'L-00020007',
        kind: 'whatever',
        title: 'Organization #27',
      },
    ]);
    ['persons', 'subjects'].forEach(kind =>
      fetchMock.get(`/api/v1.0/${kind}/autocomplete/?query=orga`, []),
    );

    const dispatchCourseSearchParamsUpdate = jest.fn();
    const { getByPlaceholderText, getByText, queryByText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            { limit: '999', offset: '0' },
            dispatchCourseSearchParamsUpdate,
          ]}
        >
          <SearchSuggestField
            filters={{ levels, organizations, persons, subjects }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    const field = getByPlaceholderText(
      'Search for courses, organizations, categories',
    );

    // Simulate the user entering some text in the autocomplete field
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'orga' } });
    await wait();

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
    await wait();

    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      query: '',
      type: 'QUERY_UPDATE',
    });
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      filter: {
        base_path: '0002',
        has_more_values: false,
        human_name: 'Organizations',
        is_autocompletable: true,
        is_searchable: true,
        name: 'organizations',
        values: [],
      },
      payload: 'L-00020007',
      type: 'FILTER_ADD',
    });
  });

  it('updates the search params when the user selects a filter suggestion', async () => {
    fetchMock.get('/api/v1.0/persons/autocomplete/?query=doct', [
      {
        id: '73',
        kind: 'persons',
        title: 'Doctor Doom',
      },
    ]);
    ['organizations', 'subjects'].forEach(kind =>
      fetchMock.get(`/api/v1.0/${kind}/autocomplete/?query=doct`, []),
    );

    const dispatchCourseSearchParamsUpdate = jest.fn();
    const { getByPlaceholderText, getByText, queryByText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            { limit: '999', offset: '0' },
            dispatchCourseSearchParamsUpdate,
          ]}
        >
          <SearchSuggestField
            filters={{ levels, organizations, persons, subjects }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    const field = getByPlaceholderText(
      'Search for courses, organizations, categories',
    );

    // Simulate the user entering some text in the autocomplete field
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'doct' } });
    await wait();

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
    await wait();

    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      filter: {
        base_path: null,
        has_more_values: false,
        human_name: 'Persons',
        is_autocompletable: true,
        is_searchable: true,
        name: 'persons',
        values: [],
      },
      payload: '73',
      type: 'FILTER_ADD',
    });
  });

  it('removes the search query when the user presses ENTER on an empty field', async () => {
    ['organizations', 'persons', 'subjects'].forEach(kind =>
      fetchMock.get(`/api/v1.0/${kind}/autocomplete/?query=some%20query`, []),
    );

    const dispatchCourseSearchParamsUpdate = jest.fn();
    const { getByPlaceholderText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            { limit: '999', offset: '0', query: 'some query' },
            dispatchCourseSearchParamsUpdate,
          ]}
        >
          <SearchSuggestField
            filters={{ levels, organizations, persons, subjects }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    const field = getByPlaceholderText(
      'Search for courses, organizations, categories',
    );

    // Simulate the user deleting the text in the autocomplete field
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: '' } });
    fireEvent.keyDown(field, { keyCode: 13 });
    await wait();

    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      query: '',
      type: 'QUERY_UPDATE',
    });
  });

  it('searches as the user types', () => {
    ['organizations', 'persons', 'subjects'].forEach(kind =>
      fetchMock.get(`begin:/api/v1.0/${kind}/autocomplete/?query=`, []),
    );

    const dispatchCourseSearchParamsUpdate = jest.fn();
    const { getByPlaceholderText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[
            { limit: '999', offset: '0', query: 'some query' },
            dispatchCourseSearchParamsUpdate,
          ]}
        >
          <SearchSuggestField
            filters={{ levels, organizations, persons, subjects }}
          />
        </CourseSearchParamsContext.Provider>
      </IntlProvider>,
    );

    const field = getByPlaceholderText(
      'Search for courses, organizations, categories',
    );
    fireEvent.focus(field);

    // NB: the tests below rely on the very crude debounce mock for lodash-debounce.
    // TODO: rewrite them when we use mocked timers to test our debouncing strategy.
    fireEvent.change(field, { target: { value: 'ri' } });
    expect(dispatchCourseSearchParamsUpdate).not.toHaveBeenCalled();

    fireEvent.change(field, { target: { value: 'ric' } });
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      query: 'ric',
      type: 'QUERY_UPDATE',
    });

    fireEvent.change(field, { target: { value: 'rich data driven' } });
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenLastCalledWith({
      query: 'rich data driven',
      type: 'QUERY_UPDATE',
    });

    fireEvent.change(field, { target: { value: '' } });
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenLastCalledWith({
      query: '',
      type: 'QUERY_UPDATE',
    });
  });
});
