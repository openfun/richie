import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { PropsWithChildren } from 'react';
import { Deferred } from 'utils/test/deferred';
import * as mockFactories from 'utils/test/factories';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieApiProvider from 'data/JoanieApiProvider';
import BaseSessionProvider from 'data/SessionProvider/BaseSessionProvider';
import { useUserWishlistCourse, useUserWishlistCourses } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockFactories
    .ContextFactory({
      authentication: {
        backend: 'fonzie',
        endpoint: 'https://authentication.test',
      },
      joanie_backend: {
        endpoint: 'https://joanie.test',
      },
    })
    .generate(),
}));

describe('useWishlistCourse', () => {
  const wishlistCourse = mockFactories.UserWishlistCourseFactory.generate();

  afterEach(() => {
    jest.clearAllMocks();
    fetchMock.restore();
  });

  const Wrapper = ({ children }: PropsWithChildren) => (
    <IntlProvider locale="en">
      <QueryClientProvider client={createTestQueryClient({ user: true })}>
        <JoanieApiProvider>
          <BaseSessionProvider>{children}</BaseSessionProvider>
        </JoanieApiProvider>
      </QueryClientProvider>
    </IntlProvider>
  );

  it('retrieves wishlist course from id', async () => {
    const responseDeferred = new Deferred();

    const urlGetWishlistById = `https://joanie.test/api/v1.0/wishlist/${wishlistCourse.id}/`;
    fetchMock.get(urlGetWishlistById, responseDeferred.promise);

    const { result } = renderHook(() => useUserWishlistCourse(wishlistCourse.id), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.states.fetching).toBe(true));
    await act(async () => {
      responseDeferred.resolve(wishlistCourse);
    });
    await waitFor(() => expect(result.current.states.fetching).toBe(false));

    expect(fetchMock.called(urlGetWishlistById)).toBe(true);
    expect(result.current.states.error).toBe(undefined);
    expect(JSON.stringify(result.current.item)).toBe(JSON.stringify(wishlistCourse));
  });

  it('retrieves wishlist course from courseCode', async () => {
    const responseDeferred = new Deferred();
    const urlGetWishlistByFilters = `https://joanie.test/api/v1.0/wishlist/?course_code=${wishlistCourse.course}`;
    fetchMock.get(urlGetWishlistByFilters, responseDeferred.promise);

    const { result } = renderHook(
      () =>
        useUserWishlistCourses({
          course_code: wishlistCourse.course,
        }),
      {
        wrapper: Wrapper,
      },
    );
    await waitFor(() => expect(result.current.states.fetching).toBe(true));

    await act(async () => {
      responseDeferred.resolve(wishlistCourse);
    });
    await waitFor(() => expect(result.current.states.fetching).toBe(false));

    expect(fetchMock.called(urlGetWishlistByFilters)).toBe(true);
    expect(result.current.states.error).toBe(undefined);
    expect(JSON.stringify(result.current.items)).toBe(JSON.stringify([wishlistCourse]));
  });

  it('retrieves all user wishlists', async () => {
    const wishlistList = mockFactories.UserWishlistCourseFactory.generate(3);
    const responseDeferred = new Deferred();

    const urlGetAllWishlist = 'https://joanie.test/api/v1.0/wishlist/';
    fetchMock.get(urlGetAllWishlist, responseDeferred.promise);

    const { result } = renderHook(() => useUserWishlistCourses(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.states.fetching).toBe(true));
    await act(async () => {
      responseDeferred.resolve(wishlistList);
    });
    await waitFor(() => expect(result.current.states.fetching).toBe(false));

    expect(fetchMock.called(urlGetAllWishlist)).toBe(true);
    expect(result.current.states.error).toBe(undefined);
    expect(JSON.stringify(result.current.items)).toBe(JSON.stringify(wishlistList));
  });

  it('adds a course to user wishlist', async () => {
    const urlWishlist = `https://joanie.test/api/v1.0/wishlist/`;
    fetchMock.get(urlWishlist, []);
    const { result } = renderHook(() => useUserWishlistCourses(), {
      wrapper: Wrapper,
    });
    fetchMock.restore();

    // We dont care about POST request return values,
    // react-query will refetch data using the GET url.
    fetchMock.post(urlWishlist, []);
    fetchMock.get(urlWishlist, [wishlistCourse]);

    result.current.methods.create(wishlistCourse.course);
    await waitFor(() => expect(result.current.states.fetching).toBe(false));

    expect(fetchMock.called(urlWishlist, { method: 'POST' }));
    expect(result.current.states.error).toBe(undefined);
    expect(JSON.stringify(result.current.items)).toBe(JSON.stringify([wishlistCourse]));
  });

  it('removes a course to user wishlist', async () => {
    const urlWishlist = `https://joanie.test/api/v1.0/wishlist/`;
    const urlDeleteWishlist = `https://joanie.test/api/v1.0/wishlist/${wishlistCourse.id}/`;
    fetchMock.get(urlWishlist, [wishlistCourse]);
    const { result } = renderHook(() => useUserWishlistCourses(), {
      wrapper: Wrapper,
    });
    fetchMock.restore();

    fetchMock.delete(urlDeleteWishlist, []);
    fetchMock.get(urlWishlist, []);

    result.current.methods.delete(wishlistCourse.id);
    await waitFor(() => expect(result.current.states.fetching).toBe(false));

    expect(fetchMock.called(urlWishlist, { method: 'DELETE' }));
    expect(result.current.states.error).toBe(undefined);
    expect(result.current.items).toEqual([]);
  });
});
