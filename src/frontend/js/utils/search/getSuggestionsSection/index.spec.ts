import fetchMock from 'fetch-mock';

import { handle } from 'utils/errors/handle';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { getSuggestionsSection } from '.';

const mockHandle: jest.Mock<typeof handle> = handle as any;
jest.mock('utils/errors/handle');
jest.mock('utils/context', () => jest.fn());

describe('utils/search/getSuggestionsSection', () => {
  afterEach(() => {
    jest.resetAllMocks();
    fetchMock.restore();
  });

  it('runs the search and builds a SearchSuggestionSection with the results', async () => {
    fetchMock.get('/api/v1.0/courses/autocomplete/?query=some%20search', [
      { id: '001', kind: 'courses', title: 'Course #1' },
      { id: '002', kind: 'courses', title: 'Course #2' },
    ]);

    let suggestionsSection;
    try {
      suggestionsSection = await getSuggestionsSection('courses', 'Courses', 'some search');
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
    expect(mockHandle).toHaveBeenCalledWith(new Error('Failed to send API request'));
  });

  it('reports the error when the server returns an error code', async () => {
    fetchMock.get('/api/v1.0/courses/autocomplete/?query=some%20search', {
      body: {},
      status: HttpStatusCode.FORBIDDEN,
    });
    await getSuggestionsSection('courses', 'Courses', 'some search');
    expect(mockHandle).toHaveBeenCalledWith(
      new Error('Failed to get list from courses autocomplete : 403'),
    );
  });

  it('reports the error and the explanation when the server returns a 400 error', async () => {
    fetchMock.get('/api/v1.0/courses/autocomplete/?query=error', {
      body: {
        errors: ['Missing autocomplete "query" for request to richie_courses.'],
      },
      status: HttpStatusCode.BAD_REQUEST,
    });
    await getSuggestionsSection('courses', 'Courses', 'error');
    expect(mockHandle).toHaveBeenCalledWith(
      new Error('Failed to get list from courses autocomplete : 400'),
      {
        errors: ['Missing autocomplete "query" for request to richie_courses.'],
      },
    );
  });

  it('reports the error when it receives broken json', async () => {
    fetchMock.get('/api/v1.0/courses/autocomplete/?query=some%20search', 'not json');
    await getSuggestionsSection('courses', 'Courses', 'some search');
    expect(mockHandle).toHaveBeenCalledWith(
      new Error(
        'Failed to decode JSON in getSuggestionSection FetchError: invalid json response body at ' +
          '/api/v1.0/courses/autocomplete/?query=some%20search reason: Unexpected token \'o\', "not json" is not valid JSON',
      ),
    );
  });
});
