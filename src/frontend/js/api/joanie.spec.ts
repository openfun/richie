import fetchMock from 'fetch-mock';
import { ResourcesQuery } from 'hooks/useResources';
import { buildApiUrl, getResponseBody } from './joanie';

describe('api/joanie', () => {
  it('getResponse should handle empty response body', async () => {
    fetchMock.mock('http://example.com', 400);
    const res = await fetch('http://example.com');
    expect(res.ok).toBe(false);
    const responseBody = await getResponseBody(res);
    expect(responseBody).toBe('');
    fetchMock.restore();
  });
  it('buildApiUrl should build api url', () => {
    interface TestApiFilters extends ResourcesQuery {
      firstname: string;
      lastname: string;
      gender: string[];
    }
    const apiFilters: TestApiFilters = {
      id: 'DUMMY_TEST_API_ID',
      firstname: 'John',
      lastname: 'Do',
      gender: ['male', 'robot'],
    };
    const url = buildApiUrl('test/:id/', apiFilters);
    expect(url).toEqual(
      'test/DUMMY_TEST_API_ID/?firstname=John&gender=male&gender=robot&lastname=Do',
    );
  });
});
