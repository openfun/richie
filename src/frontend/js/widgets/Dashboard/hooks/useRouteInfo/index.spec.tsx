import { PropsWithChildren, useMemo } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { RouterWrapper } from 'utils/test/wrappers/RouterWrapper';
import useRouteInfo from '.';

describe('useRouteInfo', () => {
  it('should return all information about the active route', async () => {
    let currentUrl = '/posts';
    // First render to match the '/posts' route
    const { result, rerender } = renderHook(useRouteInfo, {
      wrapper: ({ children }: PropsWithChildren) => {
        const initialEntries = useMemo(() => [currentUrl], [currentUrl]);
        return (
          <RouterWrapper
            initialEntries={initialEntries}
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
      },
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

    currentUrl = '/posts/a-first-post';
    rerender();

    await waitFor(() =>
      expect(result.current).toEqual({
        id: '0-0',
        pathname: '/posts/a-first-post',
        params: { postId: 'a-first-post' },
        data: undefined,
        handle: { title: 'A post' },
      }),
    );
  });
});
