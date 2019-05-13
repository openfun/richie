import React from 'react';
import { act, cleanup, render } from 'react-testing-library';

import { APIListRequestParams } from '../../types/api';
import { jestMockOf } from '../../utils/types';
import { fetchList } from '../getResourceList/getResourceList';
import { useCourseSearch } from './useCourseSearch';

jest.mock('../getResourceList/getResourceList', () => ({
  fetchList: jest.fn(),
}));
const mockFetchList = fetchList as jestMockOf<typeof fetchList>;

// This test uses async/await inside `useEffect`, which causes warnings due to the particular timing of
// resolution for `await` with relation to react renders. For most scenarios, `act` takes care of this
// scheduling, but `act` does not handle `async` functions and cannot be `await`ed yet.
// TODO: Remove this when async act is available.
// tslint:disable:no-console
console.error = jest.fn();

describe('data/useCourseSearch', () => {
  // Build a helper component with an out-of-scope function to let us reach our Hook from
  // our test cases.
  let getLatestHookValue: any;
  const TestComponent = ({ params }: { params: APIListRequestParams }) => {
    const hookValue = useCourseSearch(params);
    getLatestHookValue = () => hookValue;
    return <div />;
  };

  beforeEach(jest.resetAllMocks);

  afterEach(cleanup);

  it('gets the courses with the passed params', async () => {
    let doResolve: (value: any) => void;
    const responseOne = new Promise(resolve => (doResolve = resolve));
    mockFetchList.mockReturnValue(responseOne as any);
    const { rerender } = render(
      <TestComponent params={{ limit: '999', offset: '0' }} />,
    );

    // Initial pass gets us a null value but issues the call
    expect(getLatestHookValue()).toEqual(null);
    expect(mockFetchList).toHaveBeenCalledTimes(1);
    expect(mockFetchList).toHaveBeenCalledWith('courses', {
      limit: '999',
      offset: '0',
    });

    act(() => doResolve('the response'));
    // Wait for the actual resolution under await
    await responseOne;
    expect(getLatestHookValue()).toEqual('the response');

    // We then reset our fetchList mock and change the search params
    mockFetchList.mockReset();
    const responseTwo = new Promise(resolve => (doResolve = resolve));
    mockFetchList.mockReturnValue(responseTwo as any);
    rerender(
      <TestComponent
        params={{ limit: '999', offset: '0', organizations: ['43'] }}
      />,
    );

    // A new request is issued (meanwhile we still return the existing response)
    expect(getLatestHookValue()).toEqual('the response');
    expect(mockFetchList).toHaveBeenCalledTimes(1);
    expect(mockFetchList).toHaveBeenCalledWith('courses', {
      limit: '999',
      offset: '0',
      organizations: ['43'],
    });

    act(() => doResolve('another response'));
    // Wait for the actual resolution under await
    await responseTwo;
    expect(getLatestHookValue()).toEqual('another response');
  });

  it('does not trigger a new request if the params are unchanged', async () => {
    let doResolve: (value: any) => void;
    const responseOne = new Promise(resolve => (doResolve = resolve));
    mockFetchList.mockReturnValue(responseOne as any);
    const params = { limit: '999', offset: '0' };
    const { rerender } = render(<TestComponent params={params} />);

    // Initial pass gets us a null value but issues the call
    expect(getLatestHookValue()).toEqual(null);
    expect(mockFetchList).toHaveBeenCalledTimes(1);
    expect(mockFetchList).toHaveBeenCalledWith('courses', {
      limit: '999',
      offset: '0',
    });

    act(() => doResolve('the response'));
    // Wait for the actual resolution under await
    await responseOne;
    expect(getLatestHookValue()).toEqual('the response');

    // We reset our fetchList mock but keep the same params
    mockFetchList.mockReset();
    rerender(<TestComponent params={params} />);
    // Now new request happens as the params are weakly identical
    expect(mockFetchList).not.toHaveBeenCalled();
  });
});
