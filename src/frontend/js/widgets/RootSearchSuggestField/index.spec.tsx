import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { IntlProvider } from 'react-intl';

import { location } from 'utils/indirection/window';
import { RichieContextFactory as mockRichieContextFactory } from 'utils/test/factories/richie';
import context from 'utils/context';
import RootSearchSuggestField from '.';

jest.mock('settings', () => ({
  API_LIST_DEFAULT_PARAMS: { limit: '13', offset: '0' },
}));

jest.mock('utils/indirection/window', () => ({
  location: {
    assign: jest.fn(),
  },
}));

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory().one(),
}));

describe('<RootSearchSuggestField />', () => {
  const subjects = {
    base_path: '00030001',
    has_more_values: false,
    human_name: 'Subjects',
    is_autocompletable: true,
    is_searchable: true,
    name: 'subjects',
    values: [],
  };

  afterEach(() => {
    fetchMock.restore();
    jest.resetAllMocks();
  });

  it('renders', () => {
    fetchMock.get('/api/v1.0/filter-definitions/', {
      subjects,
    });

    render(
      <IntlProvider locale="en">
        <RootSearchSuggestField courseSearchPageUrl="/en/courses/" context={context} />
      </IntlProvider>,
    );

    // The placeholder text is shown in the input
    screen.getByPlaceholderText('Search for courses');
    // Same text should also be recognized as a true input label
    screen.getByLabelText('Search for courses');
    // The component should not issue any request "on load", before the user starts interacting
    expect(fetchMock.called()).toEqual(false);
  });

  it('gets suggestions from the API when the user types 3 characters or more in the field', async () => {
    fetchMock.get('/api/v1.0/filter-definitions/', {
      subjects,
    });

    fetchMock.get('/api/v1.0/subjects/autocomplete/?query=aut', [
      {
        id: 'L-000300010001',
        title: 'Subject #311',
      },
    ]);
    fetchMock.get('/api/v1.0/courses/autocomplete/?query=aut', []);

    render(
      <IntlProvider locale="en">
        <RootSearchSuggestField courseSearchPageUrl="/en/courses/" context={context} />
      </IntlProvider>,
    );

    const field = screen.getByPlaceholderText('Search for courses');

    // Simulate the user entering some text in the autocomplete field
    fireEvent.focus(field);

    // No requests are made until the user enters at least 3 characters
    fireEvent.change(field, { target: { value: 'au' } });
    await waitFor(() => {
      expect(fetchMock.called()).toEqual(false);
    });

    fireEvent.change(field, { target: { value: 'aut' } });

    await waitFor(() => {
      expect(fetchMock.called('/api/v1.0/subjects/autocomplete/?query=aut')).toEqual(true);
      screen.getByText('Subjects');
      screen.getByText('Subject #311');
    });

    expect(fetchMock.called('/api/v1.0/courses/autocomplete/?query=aut')).toEqual(true);
    expect(screen.queryByText('Courses')).toEqual(null);
  });

  it('goes to the course page when the user selects a course suggestion', async () => {
    fetchMock.get('/api/v1.0/filter-definitions/', {
      subjects,
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

    render(
      <IntlProvider locale="en">
        <RootSearchSuggestField courseSearchPageUrl="/en/courses/" context={context} />
      </IntlProvider>,
    );

    const field = screen.getByPlaceholderText('Search for courses');
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'aut' } });

    await waitFor(() => {
      expect(fetchMock.called('/api/v1.0/courses/autocomplete/?query=aut')).toEqual(true);
    });
    await screen.findByText('Courses');
    const course = screen.getByText('Course #42');

    expect(fetchMock.called('/api/v1.0/subjects/autocomplete/?query=aut')).toEqual(true);
    expect(screen.queryByText('Subjects')).toEqual(null);

    fireEvent.click(course);
    await waitFor(() => {
      expect(location.assign).toHaveBeenCalledTimes(1);
      expect(location.assign).toHaveBeenCalledWith('/en/courses/42');
    });
  });

  it('goes to course search with the filter value activated when the user clicks on a suggestion', async () => {
    fetchMock.get('/api/v1.0/filter-definitions/', {
      subjects,
    });

    fetchMock.get('/api/v1.0/subjects/autocomplete/?query=aut', [
      {
        id: 'L-000300010001',
        kind: 'subjects',
        title: 'Subject #311',
      },
    ]);
    fetchMock.get('/api/v1.0/courses/autocomplete/?query=aut', []);

    render(
      <IntlProvider locale="en">
        <RootSearchSuggestField courseSearchPageUrl="/en/courses/" context={context} />
      </IntlProvider>,
    );

    const field = screen.getByPlaceholderText('Search for courses');
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'aut' } });

    await waitFor(() => {
      expect(fetchMock.called('/api/v1.0/subjects/autocomplete/?query=aut')).toEqual(true);
    });
    await screen.findByText('Subjects');
    const subject = screen.getByText('Subject #311');

    expect(fetchMock.called('/api/v1.0/courses/autocomplete/?query=aut')).toEqual(true);
    expect(screen.queryByText('Courses')).toEqual(null);

    fireEvent.click(subject);
    await waitFor(() => {
      expect(location.assign).toHaveBeenCalledTimes(1);
      expect(location.assign).toHaveBeenCalledWith(
        '/en/courses/?limit=13&offset=0&subjects=L-000300010001',
      );
    });
  });

  it('moves to the search page with a search query when the user types a query and presses ENTER', async () => {
    fetchMock.get('/api/v1.0/filter-definitions/', {
      subjects,
    });

    ['courses', 'subjects'].forEach((kind) =>
      fetchMock.get(`/api/v1.0/${kind}/autocomplete/?query=some%20query`, []),
    );

    render(
      <IntlProvider locale="en">
        <RootSearchSuggestField courseSearchPageUrl="/en/courses/" context={context} />
      </IntlProvider>,
    );

    const field = screen.getByPlaceholderText('Search for courses');

    // Simulate the user typing in some text in the autocomplete field
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'some query' } });
    fireEvent.keyDown(field, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(location.assign).toHaveBeenCalledTimes(1);
      expect(location.assign).toHaveBeenCalledWith(
        '/en/courses/?limit=13&offset=0&query=some%20query',
      );
    });
  });

  it('lets the user select the currently highlighted suggestion by pressing ENTER', async () => {
    fetchMock.get('/api/v1.0/filter-definitions/', {
      subjects,
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

    render(
      <IntlProvider locale="en">
        <RootSearchSuggestField courseSearchPageUrl="/en/courses/" context={context} />
      </IntlProvider>,
    );

    const field = screen.getByPlaceholderText('Search for courses');
    fireEvent.focus(field);
    fireEvent.change(field, { target: { value: 'aut' } });

    await waitFor(() => {
      expect(fetchMock.called('/api/v1.0/courses/autocomplete/?query=aut')).toEqual(true);
    });
    await screen.findByText('Courses');
    screen.getByText('Course #42');

    expect(fetchMock.called('/api/v1.0/subjects/autocomplete/?query=aut')).toEqual(true);
    expect(screen.queryByText('Subjects')).toEqual(null);

    fireEvent.keyDown(field, { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 }); // Select the desired suggestion (there is only one)
    fireEvent.keyDown(field, { key: 'Enter', code: 'Enter', keyCode: 13 }); // Press enter
    await waitFor(() => {
      expect(location.assign).toHaveBeenCalledTimes(1);
      expect(location.assign).toHaveBeenCalledWith('/en/courses/42');
    });
  });
});
