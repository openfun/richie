import '../../testSetup';

import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';
import { cleanup, fireEvent, render, wait } from 'react-testing-library';

import { CourseSearchParamsContext } from '../../data/useCourseSearchParams/useCourseSearchParams';
import { SearchSuggestField } from './SearchSuggestField';

jest.mock('../../utils/indirection/window', () => ({ location: {} }));

describe('components/SearchSuggestField', () => {
  // Make some filters we can reuse through our tests in <SearchSuggestField /> props
  const organizations = {
    base_path: '0002',
    human_name: 'Organizations',
    name: 'organizations',
    values: [],
  };

  const subjects = {
    base_path: '00030001',
    human_name: 'Subjects',
    name: 'subjects',
    values: [],
  };

  /**
   * Helper to find the text query suggestion in the DOM through testing-library's tools.
   * This is helpful because the default query is painful to find due to the embedded <b>
   */
  const getDefaultSuggestionHelper = (value: string) => (
    _: any,
    element: HTMLElement,
  ) =>
    element.innerHTML.startsWith('Search for') &&
    !!element.querySelector('b') &&
    element.querySelector('b')!.innerHTML.includes(value) &&
    element.innerHTML.includes('in courses...');

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
    fetchMock.get('/api/v1.0/organizations/autocomplete/?query=aut', []);

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
    getByText(getDefaultSuggestionHelper('aut')); // Default suggestion is always shown
    expect(queryByText('Organizations')).toEqual(null);
  });

  it('does not attempt to get or show any suggestions before the user types 3 characters', async () => {
    fetchMock.get('/api/v1.0/categories/autocomplete/?query=xyz', []);
    fetchMock.get('/api/v1.0/organizations/autocomplete/?query=xyz', []);

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
    expect(queryByText(getDefaultSuggestionHelper('x'))).toEqual(null);

    fireEvent.change(field, { target: { value: 'xyz' } });
    await wait();

    expect(fetchMock.calls().length).toEqual(2);
    getByText(getDefaultSuggestionHelper('xyz')); // Default suggestion is now shown
  });

  it('updates the search params when the user selects a filter suggestion', async () => {
    fetchMock.get('/api/v1.0/categories/autocomplete/?query=orga', []);
    fetchMock.get('/api/v1.0/organizations/autocomplete/?query=orga', [
      {
        id: 'L-00020007',
        title: 'Organization #27',
      },
    ]);

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
    getByText(getDefaultSuggestionHelper('orga')); // Default suggestion is always shown

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

  it('updates the search params when the user selects the text query', async () => {
    fetchMock.get('/api/v1.0/categories/autocomplete/?query=def', []);
    fetchMock.get('/api/v1.0/organizations/autocomplete/?query=def', []);

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
    fireEvent.change(field, { target: { value: 'def' } });
    await wait();

    const defaultSuggestion = getByText(getDefaultSuggestionHelper('def')); // Default suggestion is always shown

    expect(queryByText('Categories')).toEqual(null);
    expect(queryByText('Courses')).toEqual(null);
    expect(queryByText('Organizations')).toEqual(null);

    fireEvent.click(defaultSuggestion);
    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      query: 'def',
      type: 'QUERY_UPDATE',
    });
  });

  it('removes the search query when the user presses ENTER on an empty field', () => {
    fetchMock.get('/api/v1.0/categories/autocomplete/?query=some%20query', []);
    fetchMock.get(
      '/api/v1.0/organizations/autocomplete/?query=some%20query',
      [],
    );

    const dispatchCourseSearchParamsUpdate = jest.fn();
    const { getByPlaceholderText, getByText, queryByText } = render(
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

    expect(dispatchCourseSearchParamsUpdate).toHaveBeenCalledWith({
      query: '',
      type: 'QUERY_UPDATE',
    });
  });
});
