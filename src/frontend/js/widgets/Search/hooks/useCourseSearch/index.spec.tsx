import { act, renderHook, waitFor } from '@testing-library/react';

import { PropsWithChildren } from 'react';
import { APIListRequestParams } from 'types/api';
import { Deferred } from 'utils/test/deferred';
import AppWrapper from 'utils/test/wrappers/AppWrapper';
import { fetchList } from '../../utils/getResourceList';
import { useCourseSearch } from '.';

jest.mock('utils/context', () => jest.fn());
jest.mock('../../utils/getResourceList', () => ({
  fetchList: jest.fn(),
}));
const mockFetchList = fetchList as jest.MockedFunction<typeof fetchList>;

describe('widgets/Search/hooks/useCourseSearch', () => {
  let locale: string;
  const wrapper = ({ children }: PropsWithChildren) => (
    <AppWrapper intlOptions={{ locale }}>{children}</AppWrapper>
  );

  it('gets the courses with the passed params', async () => {
    const deferred = new Deferred<any>();
    let params: APIListRequestParams = { limit: '999', offset: '0' };
    mockFetchList.mockReturnValue(deferred.promise);
    const { result, rerender } = renderHook(() => useCourseSearch(params), { wrapper });

    // Initial pass gets us a undefined value but issues the call
    expect(result.current.data).toEqual(undefined);
    expect(mockFetchList).toHaveBeenCalledTimes(1);
    expect(mockFetchList).toHaveBeenCalledWith('courses', {
      limit: '999',
      offset: '0',
    });

    // Wait for the actual resolution under await
    await act(async () => {
      deferred.resolve('the response');
    });
    await waitFor(() => expect(result.current.data).toEqual('the response'));

    // We then reset our fetchList mock and change the search params
    mockFetchList.mockReset();
    deferred.reset();

    mockFetchList.mockReturnValue(deferred.promise as any);
    params = { limit: '999', offset: '0', organizations: ['43'] };
    rerender();

    // A new request is issued (meanwhile we still return the existing response)
    expect(result.current.data).toEqual('the response');
    expect(mockFetchList).toHaveBeenCalledTimes(1);
    expect(mockFetchList).toHaveBeenCalledWith('courses', {
      limit: '999',
      offset: '0',
      organizations: ['43'],
    });

    await act(async () => {
      deferred.resolve('another response');
    });
    await waitFor(() => expect(result.current.data).toEqual('another response'));
  });

  it('does not trigger a new request if the params are unchanged', async () => {
    const deferred = new Deferred<any>();
    mockFetchList.mockReturnValue(deferred.promise);
    const params = { limit: '999', offset: '0' };
    const { result, rerender } = renderHook(() => useCourseSearch(params), { wrapper });

    // Initial pass gets us a undefined value but issues the call
    expect(result.current.data).toEqual(undefined);
    expect(mockFetchList).toHaveBeenCalledTimes(1);
    expect(mockFetchList).toHaveBeenCalledWith('courses', {
      limit: '999',
      offset: '0',
    });

    await act(async () => deferred.resolve('the response'));
    await waitFor(() => expect(result.current.data).toEqual('the response'));

    // We reset our fetchList mock but keep the same params
    mockFetchList.mockReset();
    rerender();
    // Now new request happens as the params are weakly identical
    expect(mockFetchList).not.toHaveBeenCalled();
  });

  it('triggers a new request if the language has changed', async () => {
    const deferred = new Deferred<any>();
    mockFetchList.mockReturnValue(deferred.promise);
    const params = { limit: '999', offset: '0' };
    const { result, rerender } = renderHook(() => useCourseSearch(params), { wrapper });

    // Initial pass gets us a undefined value but issues the call
    expect(result.current.data).toEqual(undefined);
    expect(mockFetchList).toHaveBeenCalledTimes(1);
    expect(mockFetchList).toHaveBeenCalledWith('courses', {
      limit: '999',
      offset: '0',
    });

    await act(async () => deferred.resolve('the response'));
    await waitFor(() => expect(result.current.data).toEqual('the response'));

    // We reset our fetchList mock but keep the same params
    mockFetchList.mockReset();

    await act(async () => {
      // Rerender component with a new language
      // renderHook API has changed during its add into react-testing-library and forces us to do
      // some nasty patterns: https://github.com/testing-library/react-testing-library/pull/991#issuecomment-1207138334
      locale = 'fr';
      rerender();
    });

    // As language has changed, search results should have been refetched
    await waitFor(() => expect(mockFetchList).toHaveBeenCalledTimes(1));
  });
});
