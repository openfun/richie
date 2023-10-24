import fetchMock from 'fetch-mock';
import { HttpError, HttpStatusCode } from 'utils/errors/HttpError';

import { handle as mockHandle } from 'utils/errors/handle';
import { RequestStatus } from '../../types/api';
import { fetchList } from '.';

jest.mock('utils/errors/handle', () => ({
  handle: jest.fn(),
}));

describe('widgets/Search/utils/getResourceList', () => {
  const course43 = {
    categories: [45],
    cover_image: '/about_43.png',
    end: '2018-05-31T06:00:00.000Z',
    enrollment_end: '2018-03-15T06:00:00.000Z',
    enrollment_start: '2018-02-01T06:00:00.000Z',
    id: 43,
    languages: ['fr', 'it'],
    organizations: [23, 31],
    session_number: 1,
    short_description: 'Lorem ipsum dolor sit amet consectetur adipiscim elit.',
    start: '2018-03-01T06:00:00.000Z',
    title: 'Python for data science',
  };

  const course44 = {
    categories: [7, 128],
    cover_image: '/about_44.png',
    end: '2018-04-30T06:00:00.000Z',
    enrollment_end: '2018-02-28T06:00:00.000Z',
    enrollment_start: '2018-02-01T06:00:00.000Z',
    id: 44,
    languages: ['fr', 'es'],
    organizations: [11],
    session_number: 1,
    short_description: 'Phasellus hendrerit tortor nulla, ut tristique ante aliquam sed.',
    start: '2018-03-01T06:00:00.000Z',
    title: 'Programming 101 in Python',
  };

  describe('fetchList', () => {
    afterEach(() => fetchMock.restore());

    it('requests the resource list, parses the JSON response and resolves with the results', async () => {
      fetchMock.mock(
        '/api/v1.0/courses/?limit=2&offset=43',
        JSON.stringify({ objects: [course43, course44] }),
      );

      const response = (await fetchList('courses', {
        limit: '2',
        offset: '43',
      })) as any;

      expect(response.status).toEqual(RequestStatus.SUCCESS);
      expect(response.content).toEqual({ objects: [course43, course44] });
    });

    it('rejects with a FetchListResponse containing an error when it fails to make the request', async () => {
      fetchMock.mock('/api/v1.0/courses/?limit=2&offset=43', 500);

      const response = (await fetchList('courses', {
        limit: '2',
        offset: '43',
      })) as any;

      expect(response.status).toEqual(RequestStatus.FAILURE);
      expect(response.error).toBeInstanceOf(Error);
      expect(mockHandle).toHaveBeenNthCalledWith(
        1,
        new HttpError(500, 'Failed to get list from courses search.'),
      );
    });

    it('rejects with a FetchListResponse containing an error when the API returns an error code', async () => {
      fetchMock.mock('/api/v1.0/courses/?limit=2&offset=43', HttpStatusCode.NOT_FOUND);

      const response = (await fetchList('courses', {
        limit: '2',
        offset: '43',
      })) as any;

      // Our polymorphic response object is properly shaped - with an error this time
      expect(response.objects).not.toBeDefined();
      expect(response.error).toBeInstanceOf(Error);
    });
  });
});
