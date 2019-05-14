import '../../testSetup';

import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { cleanup, fireEvent, render, wait } from 'react-testing-library';

import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';
import { SearchSuggestField } from './SearchSuggestField';

jest.mock('../../utils/indirection/window', () => ({ location: {} }));

// Unexplained difficulties with fake timers were encountered in these tests.
// We decided to mock the debounce function instead.
jest.mock('lodash-es/debounce', () => (fn: any) => (...args: any[]) =>
  fn(...args),
);

describe('components/SearchSuggestField', () => {
  // Make some filters we can reuse through our tests in <SearchSuggestField /> props
  const organizations = {
    base_path: '0002',
    human_name: 'Organizations',
    name: 'organizations',
    values: [],
  };

  const persons = {
    base_path: null,
    human_name: 'Persons',
    name: 'persons',
    values: [],
  };

  const subjects = {
    base_path: '00030001',
    human_name: 'Subjects',
    name: 'subjects',
    values: [],
  };

  beforeEach(jest.resetAllMocks);

  // Disable useless async act warnings
  // TODO: remove this spy as soon as async act is available
  beforeAll(() => {
    jest.spyOn(console, 'error');
  });

  afterEach(cleanup);
  afterEach(fetchMock.restore);

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
    fetchMock.get('/api/v1.0/categories/autocomplete/?query=aut', [
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
          <SearchSuggestField filters={{ organizations, subjects }} />
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

    getByText('Categories');
    getByText('Subject #311');
    expect(queryByText('Organizations')).toEqual(null);
  });

  it('does not attempt to get or show any suggestions before the user types 3 characters', async () => {
    ['categories', 'organizations', 'persons'].forEach(kind =>
      fetchMock.get(`/api/v1.0/${kind}/autocomplete/?query=xyz`, []),
    );

    const { getByPlaceholderText, getByText, queryByText } = render(
      <IntlProvider locale="en">
        <CourseSearchParamsContext.Provider
          value={[{ limit: '999', offset: '0' }, jest.fn()]}
        >
          <SearchSuggestField filters={{ organizations, subjects }} />
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
    expect(fetchMock.calls().length).toEqual(3);
  });

  it('updates the search params when the user selects a filter suggestion', async () => {
    fetchMock.get('/api/v1.0/organizations/autocomplete/?query=orga', [
      {
        id: 'L-00020007',
        kind: 'whatever',
        title: 'Organization #27',
      },
    ]);
    ['categories', 'persons'].forEach(kind =>
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
          <SearchSuggestField filters={{ organizations, subjects }} />
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

    getByText('Organizations');
    getByText('Organization #27');

    expect(queryByText('Categories')).toEqual(null);
    expect(queryByText('Courses')).toEqual(null);

    fireEvent.click(getByText('Organization #27'));
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      filter: {
        base_path: '0002',
        human_name: 'Organizations',
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
    ['categories', 'organizations'].forEach(kind =>
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
          <SearchSuggestField filters={{ persons, subjects }} />
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

    getByText('Persons');
    getByText('Doctor Doom');

    expect(queryByText('Categories')).toEqual(null);
    expect(queryByText('Courses')).toEqual(null);

    fireEvent.click(getByText('Doctor Doom'));
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      filter: {
        base_path: null,
        human_name: 'Persons',
        name: 'persons',
        values: [],
      },
      payload: '73',
      type: 'FILTER_ADD',
    });
  });

  it('removes the search query when the user presses ENTER on an empty field', async () => {
    fetchMock.get(
      '/api/v1.0/organizations/autocomplete/?query=some%20query',
      [],
    );
    ['categories', 'persons'].forEach(kind =>
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
          <SearchSuggestField filters={{ organizations, subjects }} />
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
    ['categories', 'organizations', 'persons'].forEach(kind =>
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
          <SearchSuggestField filters={{ organizations, subjects }} />
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
