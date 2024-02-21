import { PropsWithChildren } from 'react';
import { RouteObject, RouterProvider, createMemoryRouter } from 'react-router-dom';
import { Maybe } from 'types/utils';

export interface RouterWrapperProps extends PropsWithChildren {
  routes?: RouteObject[];
  path?: string;
  initialEntries?: Maybe<string[]>;
}

export const RouterWrapper = ({
  children,
  routes = [],
  path = '/',
  initialEntries,
}: RouterWrapperProps) => {
  const router = createMemoryRouter(
    routes.length > 0
      ? routes
      : [
          {
            path,
            element: children,
          },
        ],
    { initialEntries: initialEntries || [path] },
  );
  return <RouterProvider router={router} />;
};
