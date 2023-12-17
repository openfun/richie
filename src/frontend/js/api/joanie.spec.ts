import fetchMock from 'fetch-mock';
import { ResourcesQuery } from 'hooks/useResources';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { buildApiUrl, getResponseBody } from './joanie';

describe('api/joanie', () => {
  it('getResponse should handle empty response body', async () => {
    fetchMock.mock('http://example.com', HttpStatusCode.BAD_REQUEST);
    const res = await fetch('http://example.com');
    expect(res.ok).toBe(false);
    const responseBody = await getResponseBody(res);
    expect(responseBody).toBe('');
    fetchMock.restore();
  });

  it('buildApiUrl should build api url', () => {
    interface TestApiFilters extends ResourcesQuery {
      addresses: string[];
      age?: number;
      firstname: string;
      gender: string;
      is_active: boolean;
      lastname: string;
      links: string[];
      profile: string | null;
    }
    const apiFilters: TestApiFilters = {
      id: 'DUMMY_TEST_API_ID',
      addresses: ['1', '2'],
      age: undefined,
      firstname: 'John',
      gender: '',
      is_active: false,
      lastname: 'Do',
      links: [],
      profile: null,
    };
    const url = buildApiUrl('http://example.com/test/:id/', apiFilters);
    expect(url).toEqual(
      'http://example.com/test/DUMMY_TEST_API_ID/?addresses=1&addresses=2&firstname=John&is_active=false&lastname=Do',
    );
  });

  it('buildApiUrl should build api url with nested resource', () => {
    // If an url string parameter is not provided, it should be cleaned up
    let url = buildApiUrl('http://example.com/resource/:id/nested/:nested_id/', {
      id: '1',
    });
    expect(url).toEqual('http://example.com/resource/1/nested/');

    // Now if we provide the nested_id, it should be added to the url
    url = buildApiUrl('http://example.com/resource_1/:id/resource_2/:nested_id/', {
      id: '1',
      nested_id: '2',
    });
    expect(url).toEqual('http://example.com/resource_1/1/resource_2/2/');
  });

  it('buildApiUrl should build api url with extra query parameters', () => {
    const filters = {
      queryParameters: { id: [1, 2, 3] },
      organization_id: 'org_1',
      state: 'half_signed',
    };
    const url = buildApiUrl(
      'http://example.com/organizations/:organization_id/contracts/:id/',
      filters,
    );

    expect(url).toBe(
      'http://example.com/organizations/org_1/contracts/?id=1&id=2&id=3&state=half_signed',
    );
  });
});
