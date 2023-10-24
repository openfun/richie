import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import fetchMock from 'fetch-mock';
import { PropsWithChildren } from 'react';
import { Deferred } from 'utils/test/deferred';
import {
  CourseLightFactory,
  RichieContextFactory as mockRichieContextFactory,
} from 'utils/test/factories/richie';
import { createTestQueryClient } from 'utils/test/createTestQueryClient';
import JoanieApiProvider from 'contexts/JoanieApiContext';
import BaseSessionProvider from 'contexts/SessionContext/BaseSessionProvider';
import { HttpStatusCode } from 'utils/errors/HttpError';
import { useCourseWish } from '.';

jest.mock('utils/context', () => ({
  __esModule: true,
  default: mockRichieContextFactory({
    authentication: {
      backend: 'fonzie',
      endpoint: 'https://authentication.test',
    },
    joanie_backend: {
      endpoint: 'https://joanie.test',
    },
  }).one(),
}));

describe('useCourseWish', () => {
  const course = CourseLightFactory().one();

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

  it('retrieves course wish', async () => {
    const responseDeferred = new Deferred();

    const urlGetWishlistById = `https://joanie.test/api/v1.0/courses/${course.id}/wish/`;
    fetchMock.get(urlGetWishlistById, responseDeferred.promise);

    const { result } = renderHook(() => useCourseWish(course.id), {
      wrapper: Wrapper,
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
    const urlWishlist = `https://joanie.test/api/v1.0/courses/${course.code}/wish/`;
    fetchMock.get(urlWishlist, {
      status: HttpStatusCode.OK,
      body: {
        status: false,
      },
    });
    const { result } = renderHook(() => useCourseWish(course.code!), {
      wrapper: Wrapper,
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
    const url = `https://joanie.test/api/v1.0/courses/${course.code}/wish/`;
    fetchMock.get(url, {
      status: HttpStatusCode.OK,
      body: {
        status: true,
      },
    });
    const { result } = renderHook(() => useCourseWish(course.code!), {
      wrapper: Wrapper,
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
