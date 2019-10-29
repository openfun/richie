import { fireEvent, render, wait } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import React from 'react';
import { IntlProvider } from 'react-intl';

import { location } from 'utils/indirection/window';
import { RootSearchSuggestField } from '.';

jest.mock('utils/indirection/window', () => ({
  location: {
    assign: jest.fn(),
  },
}));

describe('<RootSearchSuggestField />', () => {
  const commonDataProps = {
    assets: {
      icons: '/icons.svg',
    },
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
  afterEach(jest.resetAllMocks);

  it('renders', () => {
    fetchMock.get('/api/v1.0/courses/?limit=1&offset=0&scope=filters', {
      filters: {
        subjects,
      },
    });

    const { getByPlaceholderText } = render(
      <IntlProvider locale="en">
        <RootSearchSuggestField
          courseSearchPageUrl="/en/courses/"
          context={commonDataProps}
        />
      </IntlProvider>,
    );

    // The placeholder text is shown in the input
    getByPlaceholderText('Search for courses');
    // The component should not issue any request "on load", before the user starts interacting
    expect(fetchMock.called()).toEqual(false);
  });

  it('gets suggestions from the API when the user types 3 characters or more in the field', async () => {
    fetchMock.get('/api/v1.0/courses/?limit=1&offset=0&scope=filters', {
      filters: {
        subjects,
      },
    });
    fetchMock.get('/api/v1.0/subjects/autocomplete/?query=aut', [
      {
        id: 'L-000300010001',
        title: 'Subject #311',
      },
    ]);
    fetchMock.get('/api/v1.0/courses/autocomplete/?query=aut', []);

    const { getByPlaceholderText, getByText, queryByText } = render(
      <IntlProvider locale="en">
        <RootSearchSuggestField
          courseSearchPageUrl="/en/courses/"
          context={commonDataProps}
        />
      </IntlProvider>,
    );

    const field = getByPlaceholderText('Search for courses');

    // Simulate the user entering some text in the autocomplete field
    fireEvent.focus(field);

    // No requests are made until the user enters at least 3 characters
    fireEvent.change(field, { target: { value: 'au' } });
    await wait();
    expect(fetchMock.called()).toEqual(false);

    fireEvent.change(field, { target: { value: 'aut' } });
    await wait();

    expect(
      fetchMock.called('/api/v1.0/courses/autocomplete/?query=aut'),
    ).toEqual(true);
    expect(queryByText('Courses')).toEqual(null);

    expect(
      fetchMock.called('/api/v1.0/subjects/autocomplete/?query=aut'),
    ).toEqual(true);
    getByText('Subjects');
    getByText('Subject #311');
  });

  it('goes to the course page when the user selects a course suggestion', async () => {
    fetchMock.get('/api/v1.0/courses/?limit=1&offset=0&scope=filters', {
      filters: {
        subjects,
      },
    });
    fetchMock.get('/api/v1.0/subjects/autocomplete/?query=aut', []);
    fetchMock.get('/api/v1.0/courses/autocomplete/?query=aut', [
      {
        absolute_url: '/en/courses/42',
        id: '42',
        kind: 'courses',
        title: 'Course #42',
      },
    ]);

    const { getByPlaceholderText, getByText, queryByText } = render(
      <IntlProvider locale="en">
        <RootSearchSuggestField
          courseSearchPageUrl="/en/courses/"
          context={commonDataProps}
        />
      </IntlProvider>,
    );

    const field = getByPlaceholderText('Search for courses');
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'aut' } });
    await wait();

    expect(
      fetchMock.called('/api/v1.0/subjects/autocomplete/?query=aut'),
    ).toEqual(true);
    expect(queryByText('Subjects')).toEqual(null);

    expect(
      fetchMock.called('/api/v1.0/courses/autocomplete/?query=aut'),
    ).toEqual(true);
    getByText('Courses');
    const course = getByText('Course #42');

    fireEvent.click(course);
    await wait();
    expect(location.assign).toHaveBeenCalledWith('/en/courses/42');
  });

  it('goes to course search with the filter value activated when the user clicks on a suggestion', async () => {
    fetchMock.get('/api/v1.0/courses/?limit=1&offset=0&scope=filters', {
      filters: {
        subjects,
      },
    });
    fetchMock.get('/api/v1.0/subjects/autocomplete/?query=aut', [
      {
        id: 'L-000300010001',
        kind: 'subjects',
        title: 'Subject #311',
      },
    ]);
    fetchMock.get('/api/v1.0/courses/autocomplete/?query=aut', []);

    const { getByPlaceholderText, getByText, queryByText } = render(
      <IntlProvider locale="en">
        <RootSearchSuggestField
          courseSearchPageUrl="/en/courses/"
          context={commonDataProps}
        />
      </IntlProvider>,
    );

    const field = getByPlaceholderText('Search for courses');
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'aut' } });
    await wait();

    expect(
      fetchMock.called('/api/v1.0/courses/autocomplete/?query=aut'),
    ).toEqual(true);
    expect(queryByText('Courses')).toEqual(null);

    expect(
      fetchMock.called('/api/v1.0/subjects/autocomplete/?query=aut'),
    ).toEqual(true);
    getByText('Subjects');
    const subject = getByText('Subject #311');

    fireEvent.click(subject);
    await wait();
    expect(location.assign).toHaveBeenCalledWith(
      '/en/courses/?limit=20&offset=0&subjects=L-000300010001',
    );
  });

  it('moves to the search page with a search query when the user types a query and presses ENTER', async () => {
    ['courses', 'subjects'].forEach(kind =>
      fetchMock.get(`/api/v1.0/${kind}/autocomplete/?query=some%20query`, []),
    );

    const { getByPlaceholderText } = render(
      <IntlProvider locale="en">
        <RootSearchSuggestField
          courseSearchPageUrl="/en/courses/"
          context={commonDataProps}
        />
      </IntlProvider>,
    );

    const field = getByPlaceholderText('Search for courses');

    // Simulate the user typing in some text in the autocomplete field
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'some query' } });
    fireEvent.keyDown(field, { keyCode: 13 });
    await wait();

    expect(location.assign).toHaveBeenCalledWith(
      '/en/courses/?limit=20&offset=0&query=some%20query',
    );
  });

  it('lets the user select the currently highlighted suggestion by pressing ENTER', async () => {
    fetchMock.get('/api/v1.0/courses/?limit=1&offset=0&scope=filters', {
      filters: {
        subjects,
      },
    });
    fetchMock.get('/api/v1.0/subjects/autocomplete/?query=aut', []);
    fetchMock.get('/api/v1.0/courses/autocomplete/?query=aut', [
      {
        absolute_url: '/en/courses/42',
        id: '42',
        kind: 'courses',
        title: 'Course #42',
      },
    ]);

    const { getByPlaceholderText, getByText, queryByText } = render(
      <IntlProvider locale="en">
        <RootSearchSuggestField
          courseSearchPageUrl="/en/courses/"
          context={commonDataProps}
        />
      </IntlProvider>,
    );

    const field = getByPlaceholderText('Search for courses');
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'aut' } });
    await wait();

    expect(
      fetchMock.called('/api/v1.0/subjects/autocomplete/?query=aut'),
    ).toEqual(true);
    expect(queryByText('Subjects')).toEqual(null);

    expect(
      fetchMock.called('/api/v1.0/courses/autocomplete/?query=aut'),
    ).toEqual(true);
    getByText('Courses');
    getByText('Course #42');

    fireEvent.keyDown(field, { keyCode: 40 }); // Select the desired suggestion (there is only one)
    fireEvent.keyDown(field, { keyCode: 13 }); // Press enter
    await wait();
    expect(location.assign).toHaveBeenCalledWith('/en/courses/42');
  });
});
