import { renderHook } from '@testing-library/react-hooks';
import { PropsWithChildren, useMemo } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import useRouteInfo from '.';

describe('useRouteInfo', () => {
  const Router = ({
    children,
    ...routerOptions
  }: PropsWithChildren<{ [key: PropertyKey]: any }>) => {
    const router = useMemo(
      () =>
        createMemoryRouter(
          [
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
          ],
          { ...routerOptions },
        ),
      [children, routerOptions],
    );

    return <RouterProvider router={router} />;
  };

  it('should return all information about the active route', async () => {
    // First render to match the '/posts' route
    const { result, waitForNextUpdate, rerender } = renderHook(useRouteInfo, {
      wrapper: Router,
      initialProps: {
        initialEntries: ['/posts'],
      },
    });

    await waitForNextUpdate();

    expect(result!.current).toEqual({
      id: '0',
      pathname: '/posts',
      params: {},
      data: { posts: [] },
      handle: undefined,
    });

    // Rerender to match the '/posts/:postId' route
    rerender({ initialEntries: ['/posts/a-first-post'] });

    await waitForNextUpdate();

    expect(result.current).toEqual({
      id: '0-0',
      pathname: '/posts/a-first-post',
      params: { postId: 'a-first-post' },
      data: undefined,
      handle: { title: 'A post' },
    });
  });
});
