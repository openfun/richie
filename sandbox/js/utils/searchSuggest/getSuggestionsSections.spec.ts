import fetchMock from 'fetch-mock';

import { Course } from '../../types/Course';
import * as errors from '../../utils/errors/handle';
import { getSuggestionsSection } from './getSuggestionsSection';

describe('utils/searchSuggest/getSuggestionsSection', () => {
  beforeEach(() => {
    spyOn(errors, 'handle');
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('runs the search and builds a SearchSuggestionSection with the results', async () => {
    fetchMock.get('/api/v1.0/courses/?query=some%20search', {
      objects: [{ title: 'Course #1' }, { title: 'Course #2' }],
    });

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
      model: 'courses',
      title: 'Courses',
      values: [
        { title: 'Course #1' } as Course,
        { title: 'Course #2' } as Course,
      ],
    });
  });

  it('reports the error when the request fails', async () => {
    fetchMock.get('/api/v1.0/courses/?query=some%20search', {
      throws: 'Failed to send API request',
    });
    await getSuggestionsSection('courses', 'Courses', 'some search');
    expect(errors.handle).toHaveBeenCalledWith(
      new Error('Failed to send API request'),
    );
  });

  it('reports the error when the server returns an error code', async () => {
    fetchMock.get('/api/v1.0/courses/?query=some%20search', {
      body: {},
      status: 403,
    });
    await getSuggestionsSection('courses', 'Courses', 'some search');
    expect(errors.handle).toHaveBeenCalledWith(
      new Error('Failed to get list from /api/v1.0/courses/ : 403'),
    );
  });

  it('reports the error when it receives broken json', async () => {
    fetchMock.get(
      '/api/v1.0/courses/?query=some%20search',
      new Response('not json'),
    );
    await getSuggestionsSection('courses', 'Courses', 'some search');
    expect(errors.handle).toHaveBeenCalledWith(
      new Error(
        'Failed to decode JSON in getSuggestionSection SyntaxError: Unexpected token o in JSON at position 1',
      ),
    );
  });
});
