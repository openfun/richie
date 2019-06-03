import fetchMock from 'fetch-mock';

import { handle } from '../../utils/errors/handle';
import { getSuggestionsSection } from './getSuggestionsSection';

const mockHandle: jest.Mock<typeof handle> = handle as any;
jest.mock('../../utils/errors/handle');

describe('utils/searchSuggest/getSuggestionsSection', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  it('runs the search and builds a SearchSuggestionSection with the results', async () => {
    fetchMock.get('/api/v1.0/courses/autocomplete/?query=some%20search', [
      { id: '001', kind: 'courses', title: 'Course #1' },
      { id: '002', kind: 'courses', title: 'Course #2' },
    ]);

    let suggestionsSection;
    try {
      suggestionsSection = await getSuggestionsSection(
        'courses',
        'Courses',
        'some search',
      );
    } catch (error) {
      fail('Did not expect getSuggestionsSection to fail');
    }

    expect(suggestionsSection).toEqual({
      kind: 'courses',
      title: 'Courses',
      values: [
        { id: '001', kind: 'courses', title: 'Course #1' },
        { id: '002', kind: 'courses', title: 'Course #2' },
      ],
    });
  });

  it('reports the error when the request fails', async () => {
    fetchMock.get('/api/v1.0/courses/autocomplete/?query=some%20search', {
      throws: new Error('Failed to send API request'),
    });
    await getSuggestionsSection('courses', 'Courses', 'some search');
    expect(mockHandle).toHaveBeenCalledWith(
      new Error('Failed to send API request'),
    );
  });

  it('reports the error when the server returns an error code', async () => {
    fetchMock.get('/api/v1.0/courses/autocomplete/?query=some%20search', {
      body: {},
      status: 403,
    });
    await getSuggestionsSection('courses', 'Courses', 'some search');
    expect(mockHandle).toHaveBeenCalledWith(
      new Error('Failed to get list from courses autocomplete : 403'),
    );
  });

  it('reports the error when it receives broken json', async () => {
    fetchMock.get(
      '/api/v1.0/courses/autocomplete/?query=some%20search',
      'not json',
    );
    await getSuggestionsSection('courses', 'Courses', 'some search');
    expect(mockHandle).toHaveBeenCalledWith(
      new Error(
        'Failed to decode JSON in getSuggestionSection FetchError: invalid json response body at ' +
          '/api/v1.0/courses/autocomplete/?query=some%20search reason: Unexpected token o in JSON at position 1',
      ),
    );
  });
});
