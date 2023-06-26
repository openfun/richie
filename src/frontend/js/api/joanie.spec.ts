import fetchMock from 'fetch-mock';
import { getResponseBody } from './joanie';

describe('api/joanie', () => {
  it('getResponse should handle empty response body', async () => {
    fetchMock.mock('http://example.com', 400);
    const res = await fetch('http://example.com');
    expect(res.ok).toBe(false);
    const responseBody = await getResponseBody(res);
    expect(responseBody).toBe('');
    fetchMock.restore();
  });
});
