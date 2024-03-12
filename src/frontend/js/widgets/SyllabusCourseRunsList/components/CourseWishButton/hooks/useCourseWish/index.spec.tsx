import { act, renderHook, waitFor } from '@testing-library/react';
import fetchMock from 'fetch-mock';
import { Deferred } from 'utils/test/deferred';
import {
  CourseLightFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { JoanieAppWrapper, setupJoanieSession } from 'utils/test/wrappers/JoanieAppWrapper';
import { useCourseWish } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: {
      backend: 'fonzie',
      endpoint: 'https://authentication.test',
    },
    joanie_backend: {
      endpoint: 'https://joanie.endpoint',
    },
  }).one(),
}));

describe('useCourseWish', () => {
  setupJoanieSession();
  const course = CourseLightFactory().one();

  it('retrieves course wish', async () => {
    const responseDeferred = new Deferred();

    const urlGetWishlistById = `https://joanie.endpoint/api/v1.0/courses/${course.id}/wish/`;
    fetchMock.get(urlGetWishlistById, responseDeferred.promise);

    const { result } = renderHook(() => useCourseWish(course.id), {
      wrapper: JoanieAppWrapper,
    });

    await waitFor(() => expect(result.current.states.fetching).toBe(true));
    await act(async () => {
      responseDeferred.resolve({
        status: HttpStatusCode.OK,
        body: {
          status: false,
        },
      });
    });
    await waitFor(() => expect(result.current.states.fetching).toBe(false));

    expect(fetchMock.called(urlGetWishlistById)).toBe(true);
    expect(result.current.states.error).toBe(undefined);
    expect(JSON.stringify(result.current.item)).toBe(JSON.stringify({ status: false }));
  });

  it('adds a course wish', async () => {
    const urlWishlist = `https://joanie.endpoint/api/v1.0/courses/${course.code}/wish/`;
    fetchMock.get(urlWishlist, {
      status: HttpStatusCode.OK,
      body: {
        status: false,
      },
    });
    const { result } = renderHook(() => useCourseWish(course.code!), {
      wrapper: JoanieAppWrapper,
    });
    fetchMock.restore();

    // We dont care about POST request return values,
    // react-query will refetch data using the GET url.
    fetchMock.post(urlWishlist, HttpStatusCode.OK);
    fetchMock.get(urlWishlist, {
      status: HttpStatusCode.OK,
      body: {
        status: true,
      },
    });

    result.current.methods.create(course.code);
    await waitFor(() => expect(result.current.states.fetching).toBe(false));

    expect(fetchMock.called(urlWishlist, { method: 'POST' })).toBe(true);
    expect(fetchMock.called(urlWishlist, { method: 'GET' })).toBe(true);
    expect(result.current.states.error).toBe(undefined);
    await waitFor(() =>
      expect(JSON.stringify(result.current.item)).toBe(JSON.stringify({ status: true })),
    );
  });

  it('removes a course to user wishlist', async () => {
    const url = `https://joanie.endpoint/api/v1.0/courses/${course.code}/wish/`;
    fetchMock.get(url, {
      status: HttpStatusCode.OK,
      body: {
        status: true,
      },
    });
    const { result } = renderHook(() => useCourseWish(course.code!), {
      wrapper: JoanieAppWrapper,
    });
    fetchMock.restore();

    fetchMock.delete(url, HttpStatusCode.OK);
    fetchMock.get(url, {
      status: HttpStatusCode.OK,
      body: {
        status: false,
      },
    });

    result.current.methods.delete(course.code!);
    await waitFor(() => expect(result.current.states.fetching).toBe(false));

    expect(fetchMock.called(url, { method: 'DELETE' })).toBe(true);
    expect(fetchMock.called(url, { method: 'GET' })).toBe(true);
    expect(result.current.states.error).toBe(undefined);
    expect(JSON.stringify(result.current.item)).toBe(JSON.stringify({ status: false }));
  });
});
