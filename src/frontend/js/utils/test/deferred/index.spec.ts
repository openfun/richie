import fetchMock from 'fetch-mock';
import { Deferred } from 'utils/test/deferred';

describe('test::deferred', () => {
  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  it('handles error codes', async () => {
    // const todo: Todo = TodoFactory.generate();
    const responseDeferred = new Deferred();
    fetchMock.get('https://demo.endpoint/deferred/error', responseDeferred.promise);
    responseDeferred.resolve({
      status: 500,
    });
    const response = await fetch('https://demo.endpoint/deferred/error');
    expect(response.status).toBe(500);
  });
});
