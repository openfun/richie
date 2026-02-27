import { PropsWithChildren, useMemo } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { RouterWrapper } from 'utils/test/wrappers/RouterWrapper';
import useRouteInfo from '.';

describe('useRouteInfo', () => {
  it('should return all information about the active route', async () => {
    const buildWrapper = (url: string) => {
      return ({ children }: PropsWithChildren) => (
        <RouterWrapper
          initialEntries={[url]}
          routes={[
            {
              path: '/posts',
              element: <div data-testid="posts">{children}</div>,
              loader: () => ({ posts: [] }),
              children: [
                {
                  path: ':postId',
                  element: <div data-testid="route-post">{children}</div>,
                  handle: { title: 'A post' },
                },
              ],
            },
          ]}
        />
      );
    };
    const { result, unmount } = renderHook(useRouteInfo, {
      wrapper: buildWrapper('/posts'),
    });

    await waitFor(() =>
      expect(result!.current).toEqual({
        id: '0',
        pathname: '/posts',
        params: {},
        data: { posts: [] },
        handle: undefined,
      }),
    );

    unmount();

    const { result: result2 } = renderHook(useRouteInfo, {
      wrapper: buildWrapper('/posts/a-first-post'),
    });

    await waitFor(() =>
      expect(result2.current).toEqual({
        id: '0-0',
        pathname: '/posts/a-first-post',
        params: { postId: 'a-first-post' },
        data: undefined,
        handle: { title: 'A post' },
      }),
    );
  });
});
